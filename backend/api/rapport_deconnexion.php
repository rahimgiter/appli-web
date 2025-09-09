<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Connexion à la base
$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Connexion échouée : " . $conn->connect_error]);
    exit;
}

// Récupérer le id_utilisateur envoyé
$data = json_decode(file_get_contents("php://input"), true);
$id_utilisateur = $data['userId'] ?? null;

if (!$id_utilisateur) {
    echo json_encode(["status" => "error", "message" => "UserId manquant"]);
    exit;
}

// Mettre à jour la dernière entrée sans heure_deconnexion
$stmt = $conn->prepare("
    UPDATE journal_connexions 
    SET heure_deconnexion = NOW() 
    WHERE id_utilisateur = ? AND heure_deconnexion IS NULL 
    ORDER BY heure_connexion DESC 
    LIMIT 1
");
$stmt->bind_param("i", $id_utilisateur);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Déconnexion enregistrée"]);
} else {
    echo json_encode(["status" => "error", "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
