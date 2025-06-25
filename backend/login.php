<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

// Connexion à la base
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");
$data = json_decode(file_get_contents("php://input"), true);

$identifiant = $data['identifiant'] ?? '';
$mot_de_passe = $data['mot_de_passe'] ?? '';

// Requête
$sql = "SELECT * FROM utilisateur WHERE identifiant = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$identifiant]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    // Vérification du mot de passe
    if ($user['mot_de_passe'] === $mot_de_passe) { // ⚠️ à remplacer par password_verify() si hash
        echo json_encode([
            "success" => true,
            "utilisateur" => [
                "id" => $user['id_utilisateur'],
                "nom" => $user['nom'],
                "role" => $user['role']
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Mot de passe incorrect"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Identifiant non trouvé"
    ]);
}
?>
