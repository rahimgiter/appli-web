<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier si l'utilisateur a le droit de créer des comptes
session_start();
if (!isset($_SESSION['id_utilisateur']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "message" => "Accès non autorisé. Seul un administrateur peut créer des utilisateurs."]);
    exit;
}

// Lire le JSON
$data = json_decode(file_get_contents("php://input"), true);

// Vérifier les champs obligatoires
if (
    !isset($data['nom_famille']) || !isset($data['prenom']) || !isset($data['fonction']) ||
    !isset($data['email']) || !isset($data['mot_de_passe']) || !isset($data['role'])
) {
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires"]);
    exit;
}

// Validation des données
$nom_famille = trim($data['nom_famille']);
$prenom = trim($data['prenom']);
$fonction = trim($data['fonction']);
$email = trim($data['email']);
$mot_de_passe = $data['mot_de_passe'];
$role = trim($data['role']);

// Vérifier la longueur des champs
if (strlen($nom_famille) < 2 || strlen($prenom) < 2) {
    echo json_encode(["success" => false, "message" => "Le nom et prénom doivent contenir au moins 2 caractères"]);
    exit;
}

// Validation de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Format d'email invalide"]);
    exit;
}

// Validation du rôle
$roles_autorises = ['admin', 'editeur', 'observateur'];
if (!in_array($role, $roles_autorises)) {
    echo json_encode(["success" => false, "message" => "Rôle non valide. Rôles autorisés: " . implode(', ', $roles_autorises)]);
    exit;
}

// Validation du mot de passe
if (strlen($mot_de_passe) < 6) {
    echo json_encode(["success" => false, "message" => "Le mot de passe doit contenir au moins 6 caractères"]);
    exit;
}

// Connexion à la base
try {
    $conn = new mysqli("localhost", "root", "", "reseau");
    $conn->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion à la base de données"]);
    exit;
}

try {
    // Vérifier si l'email existe déjà
    $check_stmt = $conn->prepare("SELECT id_utilisateur FROM utilisateur WHERE email = ?");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_stmt->store_result();
    
    if ($check_stmt->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Cet email est déjà utilisé"]);
        $check_stmt->close();
        $conn->close();
        exit;
    }
    $check_stmt->close();

    // Vérifier si l'identifiant existe déjà (s'il est fourni)
    if (isset($data['identifiant']) && !empty(trim($data['identifiant']))) {
        $identifiant = trim($data['identifiant']);
        $check_identifiant_stmt = $conn->prepare("SELECT id_utilisateur FROM utilisateur WHERE identifiant = ?");
        $check_identifiant_stmt->bind_param("s", $identifiant);
        $check_identifiant_stmt->execute();
        $check_identifiant_stmt->store_result();
        
        if ($check_identifiant_stmt->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "Cet identifiant est déjà utilisé"]);
            $check_identifiant_stmt->close();
            $conn->close();
            exit;
        }
        $check_identifiant_stmt->close();
    }

    // Hacher le mot de passe
    $mot_de_passe_hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);
    
    // Générer un identifiant unique si non fourni
    $identifiant = isset($data['identifiant']) && !empty(trim($data['identifiant'])) 
        ? trim($data['identifiant']) 
        : strtolower($prenom . '.' . $nom_famille);

    // Préparer et exécuter la requête d'insertion
    $stmt = $conn->prepare("INSERT INTO utilisateur (nom_famille, prenom, fonction, identifiant, email, mot_de_passe, role, actif, date_creation) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())");
    $stmt->bind_param(
        "sssssss",
        $nom_famille,
        $prenom,
        $fonction,
        $identifiant,
        $email,
        $mot_de_passe_hash,
        $role
    );
    $stmt->execute();

    // Récupérer l'ID du nouvel utilisateur
    $nouvel_utilisateur_id = $stmt->insert_id;

    // Journaliser la création
    $journal_stmt = $conn->prepare("INSERT INTO journal_actions (id_utilisateur, action, details, date_action) VALUES (?, 'creation_utilisateur', ?, NOW())");
    $details = "Création de l'utilisateur: " . $prenom . " " . $nom_famille . " (" . $role . ")";
    $journal_stmt->bind_param("is", $_SESSION['id_utilisateur'], $details);
    $journal_stmt->execute();
    $journal_stmt->close();

    echo json_encode([
        "success" => true, 
        "message" => "Utilisateur créé avec succès",
        "utilisateur" => [
            "id_utilisateur" => $nouvel_utilisateur_id,
            "nom_famille" => $nom_famille,
            "prenom" => $prenom,
            "fonction" => $fonction,
            "identifiant" => $identifiant,
            "email" => $email,
            "role" => $role
        ]
    ]);
    
    $stmt->close();

} catch (mysqli_sql_exception $e) {
    error_log("Erreur création utilisateur: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erreur lors de la création de l'utilisateur"]);
}

$conn->close();
?>