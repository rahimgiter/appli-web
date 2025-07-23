<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Le reste de ton code ici...


// Lire le JSON
$data = json_decode(file_get_contents("php://input"), true);

// Vérifier les champs obligatoires
if (
    !isset($data['nom_famille']) || !isset($data['prenom']) || !isset($data['fonction']) ||
    !isset($data['identifiant']) || !isset($data['mot_de_passe']) || !isset($data['role'])
) {
    echo json_encode(["success" => false, "message" => "Champs requis manquants"]);
    exit;
}

// Connexion à la base
$conn = new mysqli("localhost", "root", "", "reseau");

// Activer les erreurs MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Préparer et exécuter la requête
    $stmt = $conn->prepare("INSERT INTO utilisateur (nom_famille, prenom, fonction, identifiant, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "ssssss",
        $data['nom_famille'],
        $data['prenom'],
        $data['fonction'],
        $data['identifiant'],
        $data['mot_de_passe'],  // ⚠️ À sécuriser avec password_hash() en prod
        $data['role']
    );
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Utilisateur ajouté avec succès"]);
    $stmt->close();
} catch (mysqli_sql_exception $e) {
    echo json_encode(["success" => false, "message" => "Erreur SQL : " . $e->getMessage()]);
}

$conn->close();
