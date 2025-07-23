<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Connexion à la base de données
$conn = new mysqli("localhost", "root", "", "reseau");

// Vérifie la connexion
if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Récupère l'identifiant de la province
$id_province = $_GET['id_province'] ?? null;

if (!$id_province) {
    echo json_encode([]);
    exit;
}

// Requête SQL pour récupérer les villages liés à cette province
$sql = "
SELECT 
    v.id_village, 
    v.nom_village, 
    v.hommes, 
    v.femmes, 
    v.pop_total
FROM village v
JOIN commune c ON v.id_commune = c.id_commune
JOIN province p ON c.id_province = p.id_province
WHERE p.id_province = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_province);
$stmt->execute();

$result = $stmt->get_result();
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

$stmt->close();
$conn->close();
