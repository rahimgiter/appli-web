<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

$conn = new mysqli("localhost", "root", "", "reseau");
$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id_utilisateur'] ?? null;

if ($id) {
    // 🔽🔽🔽 CORRECTION ICI - actif = 0 pour DÉSACTIVER 🔽🔽🔽
    $stmt = $conn->prepare("UPDATE utilisateur SET actif = 0 WHERE id_utilisateur = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Utilisateur désactivé avec succès"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erreur lors de la désactivation"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "ID utilisateur manquant"]);
}

$conn->close();
?>