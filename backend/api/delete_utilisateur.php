<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

$conn = new mysqli("localhost", "root", "", "reseau");
$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id_utilisateur'] ?? null;

if ($id) {
    $stmt = $conn->prepare("DELETE FROM utilisateur WHERE id_utilisateur = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Erreur suppression"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "ID manquant"]);
}

$conn->close();
