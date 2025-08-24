<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$conn = new mysqli("localhost", "root", "", "reseau");

$data = json_decode(file_get_contents("php://input"), true);

$id_village = $data['id_village'] ?? null;
$qualite_2g = $data['qualite_2g'] ?? null;
$qualite_3g = $data['qualite_3g'] ?? null;
$qualite_4g = $data['qualite_4g'] ?? null;
$antenne = $data['antenne'] ?? 0;
$operateur = $data['operateur'] ?? null;

if (!$id_village) {
    echo json_encode(["success" => false, "message" => "ID village manquant"]);
    exit;
}


$stmt = $conn->prepare("
    INSERT INTO site (
        id_village, qualite_2g, qualite_3g, qualite_4g, antenne_disponible, operateur
    ) VALUES (?, ?, ?, ?, ?, ?)
");

$stmt->bind_param("isssis", $id_village, $qualite_2g, $qualite_3g, $qualite_4g, $antenne, $operateur);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Données enregistrées"]);
} else {
    echo json_encode(["success" => false, "message" => "Erreur d'enregistrement"]);
}
