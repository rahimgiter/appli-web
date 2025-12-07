<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

// Vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

$id_departement = $_GET['id_departement'] ?? null;

if ($id_departement) {
    // Récupérer les localités par département
    $stmt = $conn->prepare("SELECT * FROM localite WHERE id_departement = ?");
    $stmt->bind_param("i", $id_departement);
    $stmt->execute();
    $res = $stmt->get_result();
} else {
    // Récupérer toutes les localités
    $res = $conn->query("SELECT * FROM localite");
}

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>