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
$email = $data['email'] ?? '';
$mot_de_passe = $data['mot_de_passe'] ?? '';

// Validation des données
if (empty($email) || empty($mot_de_passe)) {
    echo json_encode(["success" => false, "message" => "Email et mot de passe requis"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Format d'email invalide"]);
    exit;
}

// Vérification de l'utilisateur par EMAIL
$sql = "SELECT * FROM utilisateur WHERE email = ? AND actif = 1";
$stmt = $conn->prepare($sql);
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect"]);
    exit;
}

// Vérification du mot de passe HACHÉ
if (!password_verify($mot_de_passe, $user['mot_de_passe'])) {
    echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect"]);
    exit;
}

// Connexion réussie - Stocker l'ID utilisateur dans la session
$_SESSION['id_utilisateur'] = $user['id_utilisateur'];

// Enregistrer l'heure de connexion (vérifier si la table existe)
try {
    $insert = $conn->prepare("INSERT INTO journal_connexions (id_utilisateur, heure_connexion) VALUES (?, NOW())");
    $insert->execute([$user['id_utilisateur']]);
    $id_connexion = $conn->lastInsertId();
    $_SESSION['id_connexion'] = $id_connexion;
} catch (Exception $e) {
    // Si la table n'existe pas, on continue sans journaliser
    $id_connexion = uniqid('conn_', true);
    $_SESSION['id_connexion'] = $id_connexion;
}

// Réponse avec les informations utilisateur
echo json_encode([
    "success" => true,
    "message" => "Connexion réussie",
    "utilisateur" => [
        "id_utilisateur" => $user['id_utilisateur'],
        "nom_famille" => $user['nom_famille'],
        "prenom" => $user['prenom'],
        "fonction" => $user['fonction'],
        "email" => $user['email'],
        "role" => $user['role']
    ],
    "id_connexion" => $_SESSION['id_connexion']
]);
?>