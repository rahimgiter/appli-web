<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

$conn = new mysqli("localhost", "root", "", "reseau");

// Vérification de la connexion
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erreur connexion DB: " . $conn->connect_error]);
    exit;
}

// Lecture des données JSON
$data = json_decode(file_get_contents("php://input"), true);

// Validation basique
if (!isset($data['id_utilisateur'])) {
    echo json_encode(["success" => false, "message" => "ID utilisateur manquant"]);
    exit;
}

// Préparation de la requête
$stmt = $conn->prepare("UPDATE utilisateur SET nom_famille=?, prenom=?, fonction=?, identifiant=?, mot_de_passe=?, role=? WHERE id_utilisateur=?");
$stmt->bind_param(
    "ssssssi",
    $data['nom_famille'],
    $data['prenom'],
    $data['fonction'],
    $data['identifiant'],
    $data['mot_de_passe'],
    $data['role'],
    $data['id_utilisateur']
);

// Exécution
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erreur modification : " . $stmt->error]);
}

$stmt->close();
$conn->close();
