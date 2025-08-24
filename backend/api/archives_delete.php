<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

// Connexion DB
$conn = new mysqli("localhost", "root", "", "reseau");

// Lire les données JSON
$data = json_decode(file_get_contents("php://input"), true);

// Vérification
if (!isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "ID manquant"]);
    exit;
}

$id = $data['id'];

// Préparer la requête
$stmt = $conn->prepare("DELETE FROM ajout_infos WHERE id = ?");
$stmt->bind_param("i", $id);

// Exécution
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erreur suppression : " . $stmt->error]);
}

$stmt->close();
$conn->close();
