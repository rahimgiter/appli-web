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
    $rows = $sheet->toArray();

    $inserted = 0;
    $skipped = 0;

    foreach ($rows as $index => $row) {
        if ($index === 0) continue; // ignorer l'en-tête

        $nom_localite = trim($row[0]);
        $couverture = trim($row[1]); // peut être utilisé si besoin
        $nom_site = trim($row[2]);
        $longitude_site = floatval($row[3]);
        $latitude_site = floatval($row[4]);

        // récupérer id_localite via son nom
        $stmt = $conn->prepare("SELECT id_localite FROM localite WHERE nom_localite = ?");
        $stmt->bind_param("s", $nom_localite);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $skipped++;
            continue; // pas de localité correspondante
        }

        $id_localite = $result->fetch_assoc()['id_localite'];

        // Insertion
        $sql = "INSERT INTO site (nom_site, latitude_site, longitude_site, id_localite, id_operateur, id_type_site, annee_site, id_trimestre)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sddiiisi", $nom_site, $latitude_site, $longitude_site, $id_localite, $id_operateur, $id_type_site, $annee_site, $id_trimestre);

        if ($stmt->execute()) {
            $inserted++;
        } else {
            $skipped++;
        }
    }

    echo json_encode([
        "message" => "✅ Import terminé",
        "importés" => $inserted,
        "ignorés" => $skipped
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur lors du traitement du fichier", "details" => $e->getMessage()]);
}
$conn->close();
