<?php
// CORS (si frontend React)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Pré-vol
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifie s’il y a un fichier + champs obligatoires
if (
    !isset($_FILES['file']) ||
    !isset($_POST['id_operateur']) ||
    !isset($_POST['id_type_site']) ||
    !isset($_POST['annee_site']) ||
    !isset($_POST['id_trimestre'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Paramètres ou fichier manquants"]);
    exit;
}

require '../../vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base"]);
    exit;
}

$id_operateur = intval($_POST['id_operateur']);
$id_type_site = intval($_POST['id_type_site']);
$annee_site = $_POST['annee_site'];
$id_trimestre = intval($_POST['id_trimestre']);

$fileTmpPath = $_FILES['file']['tmp_name'];

try {
    $spreadsheet = IOFactory::load($fileTmpPath);
    $sheet = $spreadsheet->getActiveSheet();

    // Récupérer la première ligne (en-tête)
    $headerRow = $sheet->getRowIterator(1, 1)->current();
    $cells = iterator_to_array($headerRow->getCellIterator());
    $headers = array_map(function($cell) {
        return trim($cell->getValue());
    }, $cells);

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
        echo json_encode(["error" => "Le fichier Excel doit contenir les colonnes : Nom_localite, Nom_site, Longitude_Site, Latitude_Site"]);
        exit;
    }

    $inserted = 0;
    $skipped = 0;

    // Parcourir toutes les lignes sauf la première (déjà lue comme en-tête)
    foreach ($sheet->getRowIterator(2) as $row) {
        $cells = iterator_to_array($row->getCellIterator());
        $rowData = array_map(function($cell) {
            return $cell->getValue();
        }, $cells);

        // Ignorer les lignes vides ou les en-têtes répétés
        if (empty($rowData) || !isset($rowData[$colIndex['nom_localite']]) || $rowData[$colIndex['nom_localite']] === 'Nom_localite') {
            $skipped++;
            continue;
        }

        $nom_localite = trim($rowData[$colIndex['nom_localite']]);
        $nom_site = trim($rowData[$colIndex['nom_site']]);
        $longitude = floatval($rowData[$colIndex['longitude']]);
        $latitude = floatval($rowData[$colIndex['latitude']]);

        // Optionnel : ignorer si longitude/latitude sont nulles
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
            $skipped++;
            continue; // pas de localité correspondante
        }

        $id_localite = $result->fetch_assoc()['id_localite'];

        // Vérifier si le site existe déjà (doublon)
        $checkSql = "SELECT id_site FROM site WHERE nom_site = ? AND id_localite = ? AND id_operateur = ? AND id_type_site = ? AND annee_site = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("siiis", $nom_site, $id_localite, $id_operateur, $id_type_site, $annee_site);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows > 0) {
            // Site déjà existant, ignorer
            $skipped++;
            continue;
        }

        // Insertion du site (pas de doublon)
        $sql = "INSERT INTO site (nom_site, latitude_site, longitude_site, id_localite, id_operateur, id_type_site, annee_site, id_trimestre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sddiiisi", $nom_site, $latitude, $longitude, $id_localite, $id_operateur, $id_type_site, $annee_site, $id_trimestre);

        if ($stmt->execute()) {
            $inserted++;
        } else {
            $skipped++;
        }
    }

    echo json_encode([
        "message" => "✅ Import terminé",
        "importés" => $inserted,
        "ignorés" => $skipped,
        "details" => [
            "sites_ajoutés" => $inserted,
            "doublons_ignorés" => $skipped,
            "total_traités" => $inserted + $skipped
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur lors du traitement du fichier",
        "details" => $e->getMessage()
    ]);
}

$conn->close();