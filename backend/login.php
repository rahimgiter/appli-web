<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");

// Connexion à la base
try {
    $conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion à la base"]);
    exit;
}

// Données reçues
$data = json_decode(file_get_contents("php://input"), true);
$identifiant = $data['identifiant'] ?? '';
$mot_de_passe = $data['mot_de_passe'] ?? '';

if (empty($identifiant) || empty($mot_de_passe)) {
    echo json_encode(["success" => false, "message" => "Identifiant et mot de passe requis"]);
    exit;
}

// Vérification de l'utilisateur
$sql = "SELECT * FROM utilisateur WHERE identifiant = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$identifiant]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['mot_de_passe'] !== $mot_de_passe) {
    echo json_encode(["success" => false, "message" => "Identifiants incorrects"]);
    exit;
}

// Stocker l'ID utilisateur dans la session
$_SESSION['id_utilisateur'] = $user['id_utilisateur'];

// Enregistrer l'heure de connexion
$insert = $conn->prepare("INSERT INTO journal_connexions (id_utilisateur, heure_connexion) VALUES (?, NOW())");
$insert->execute([$user['id_utilisateur']]);

// Stocker l'id_connexion nouvellement généré pour le logout
$_SESSION['id_connexion'] = $conn->lastInsertId();

// Réponse
echo json_encode([
    "success" => true,
    "utilisateur" => [
        "id" => $user['id_utilisateur'],
        "nom_complet" => $user['prenom'] . " " . $user['nom_famille'],
        "fonction" => $user['fonction'],
        "role" => $user['role']
    ],
    "id_connexion" => $conn->lastInsertId()
]);
?>
