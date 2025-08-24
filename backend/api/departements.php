<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

$id_province = isset($_GET['id_province']) ? intval($_GET['id_province']) : null;

if ($id_province) {
    $stmt = $conn->prepare("SELECT id_departement, nom_departement, id_province FROM departement WHERE id_province = ?");
    $stmt->bind_param("i", $id_province);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query("SELECT id_departement, nom_departement, id_province FROM departement");
}

$departements = [];
while ($row = $result->fetch_assoc()) {
    $departements[] = $row;
}

echo json_encode($departements);
$conn->close();
?>
