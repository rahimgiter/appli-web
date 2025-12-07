<?php
// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// DEBUG: Log toutes les requêtes
error_log("=== DEBUG IMPORT SITES ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD']);
error_log("POST: " . print_r($_POST, true));
error_log("FILES: " . print_r($_FILES, true));

// Pré-vol
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// DEBUG: Simuler des données pour le test direct
if ($_SERVER['REQUEST_METHOD'] === 'GET' || empty($_FILES)) {
    // Mode test - retourner une réponse de test
    echo json_encode([
        "sites_ajoutes" => 5,
        "doublons_ignores" => 3,
        "total_traite" => 8,
        "debug" => "mode_test_sans_fichier",
        "post_received" => $_POST,
        "files_received" => $_FILES
    ]);
    exit;
}

// Vérifie s'il y a un fichier + champs obligatoires
if (
    !isset($_FILES['file']) ||
    !isset($_POST['id_operateur']) ||
    !isset($_POST['id_type_site']) ||
    !isset($_POST['annee_site']) ||
    !isset($_POST['id_trimestre'])
) {
    http_response_code(400);
    echo json_encode([
        "error" => "Paramètres ou fichier manquants",
        "debug_post" => $_POST,
        "debug_files" => $_FILES,
        "required_params" => [
            'id_operateur', 'id_type_site', 'annee_site', 'id_trimestre', 'file'
        ]
    ]);
    exit;
}

require '../../vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base: " . $conn->connect_error]);
    exit;
}

$id_operateur = intval($_POST['id_operateur']);
$id_type_site = intval($_POST['id_type_site']);
$annee_site = $_POST['annee_site'];
$id_trimestre = intval($_POST['id_trimestre']);

$fileTmpPath = $_FILES['file']['tmp_name'];

error_log("Paramètres reçus: operateur=$id_operateur, type_site=$id_type_site, annee=$annee_site, trimestre=$id_trimestre");
error_log("Fichier: " . $_FILES['file']['name'] . " (tmp: $fileTmpPath)");

try {
    // Vérifier si le fichier existe
    if (!file_exists($fileTmpPath)) {
        throw new Exception("Fichier temporaire non trouvé: $fileTmpPath");
    }

    $spreadsheet = IOFactory::load($fileTmpPath);
    $sheet = $spreadsheet->getActiveSheet();

    // Récupérer la première ligne (en-tête)
    $headerRow = $sheet->getRowIterator(1, 1)->current();
    $cells = iterator_to_array($headerRow->getCellIterator());
    $headers = array_map(function($cell) {
        return trim($cell->getValue());
    }, $cells);

    error_log("En-têtes Excel détectés: " . implode(", ", $headers));

    // Trouver les index par nom de colonne
    $colIndex = [];
    foreach ($headers as $i => $header) {
        switch ($header) {
            case 'Nom_localite':
                $colIndex['nom_localite'] = $i;
                break;
            case 'Nom_site':
                $colIndex['nom_site'] = $i;
                break;
            case 'Longitude_Site':
                $colIndex['longitude'] = $i;
                break;
            case 'Latitude_Site':
                $colIndex['latitude'] = $i;
                break;
        }
    }

    // Vérifier que toutes les colonnes nécessaires existent
    if (!isset($colIndex['nom_localite']) || !isset($colIndex['nom_site']) ||
        !isset($colIndex['longitude']) || !isset($colIndex['latitude'])) {
        http_response_code(400);
        echo json_encode([
            "error" => "Colonnes manquantes dans le fichier Excel",
            "headers_trouves" => $headers,
            "index_trouves" => $colIndex,
            "colonnes_requises" => ['Nom_localite', 'Nom_site', 'Longitude_Site', 'Latitude_Site']
        ]);
        exit;
    }

    $inserted = 0;
    $skipped = 0;
    $localites_manquantes = 0;
    $doublons = 0;
    $erreurs_insertion = 0;

    // Parcourir toutes les lignes sauf la première
    foreach ($sheet->getRowIterator(2) as $row) {
        $cells = iterator_to_array($row->getCellIterator());
        $rowData = array_map(function($cell) {
            return $cell->getValue();
        }, $cells);

        // Ignorer les lignes vides
        if (empty($rowData) || !isset($rowData[$colIndex['nom_localite']]) || trim($rowData[$colIndex['nom_localite']]) === '') {
            $skipped++;
            continue;
        }

        // Ignorer les en-têtes répétés
        if ($rowData[$colIndex['nom_localite']] === 'Nom_localite') {
            $skipped++;
            continue;
        }

        $nom_localite = trim($rowData[$colIndex['nom_localite']]);
        $nom_site = trim($rowData[$colIndex['nom_site']]);
        
        // CORRECTION: Gérer les nombres avec virgules
        $longitude_str = trim(str_replace(',', '.', $rowData[$colIndex['longitude']]));
        $latitude_str = trim(str_replace(',', '.', $rowData[$colIndex['latitude']]));
        
        $longitude = floatval($longitude_str);
        $latitude = floatval($latitude_str);

        // Ignorer si longitude/latitude sont nulles
        if ($longitude == 0.0 && $latitude == 0.0) {
            $skipped++;
            continue;
        }

        // Récupérer id_localite via nom_localite
        $stmt = $conn->prepare("SELECT id_localite FROM localite WHERE nom_localite = ?");
        $stmt->bind_param("s", $nom_localite);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            error_log("Localité non trouvée: $nom_localite");
            $localites_manquantes++;
            $skipped++;
            continue;
        }

        $id_localite = $result->fetch_assoc()['id_localite'];

        // Vérifier si le site existe déjà (doublon)
        $checkSql = "SELECT id_site FROM site WHERE nom_site = ? AND id_localite = ? AND id_operateur = ? AND id_type_site = ? AND annee_site = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("siiis", $nom_site, $id_localite, $id_operateur, $id_type_site, $annee_site);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows > 0) {
            error_log("Doublon détecté: $nom_site dans $nom_localite");
            $doublons++;
            $skipped++;
            continue;
        }

        // Insertion du site
        $sql = "INSERT INTO site (nom_site, latitude_site, longitude_site, id_localite, id_operateur, id_type_site, annee_site, id_trimestre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sddiiisi", $nom_site, $latitude, $longitude, $id_localite, $id_operateur, $id_type_site, $annee_site, $id_trimestre);

        if ($stmt->execute()) {
            $inserted++;
            error_log("✅ Site importé: $nom_site");
        } else {
            error_log("❌ Erreur insertion: " . $stmt->error);
            $erreurs_insertion++;
            $skipped++;
        }
    }

    error_log("=== RÉSULTAT IMPORT ===");
    error_log("Sites ajoutés: $inserted, Doublons: $doublons, Ignorés: $skipped");

    // FORMAT DE RÉPONSE CORRIGÉ POUR LE FRONTEND
    echo json_encode([
        "sites_ajoutes" => $inserted,
        "doublons_ignores" => $doublons,
        "total_traite" => $inserted + $skipped,
        "details" => [
            "localites_manquantes" => $localites_manquantes,
            "erreurs_insertion" => $erreurs_insertion,
            "total_lignes_traitees" => $inserted + $skipped
        ],
        "debug" => [
            "fichier" => $_FILES['file']['name'],
            "parametres" => [
                'operateur' => $id_operateur,
                'type_site' => $id_type_site,
                'annee' => $annee_site,
                'trimestre' => $id_trimestre
            ]
        ]
    ]);

} catch (Exception $e) {
    error_log("❌ ERREUR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur lors du traitement du fichier",
        "details" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}

$conn->close();
?>