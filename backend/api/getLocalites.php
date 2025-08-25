<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
require_once 'cors.php';

// Connexion à la base de données
$conn = new mysqli("localhost", "root", "", "reseau");

// Vérification de la connexion
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Récupération de l'ID de la commune si fourni
$id_commune = isset($_GET['id_departement']) ? intval($_GET['id_departement']) : null;

if ($id_commune) {
    $stmt = $conn->prepare("SELECT id_localite, nom_localite, latitude, longitude, id_departement, hommes, femmes, pop_total FROM localite WHERE id_departement = ?");
    $stmt->bind_param("i", $id_commune);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query("SELECT id_localite, nom_localite, latitude, longitude, id_departement, hommes, femmes, pop_total FROM localite");
}

$localites = [];
while ($row = $result->fetch_assoc()) {
    $localites[] = $row;
}

echo json_encode($localites);
$conn->close();
