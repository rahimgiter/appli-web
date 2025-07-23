<?php
session_start();

// CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");

// Requête OPTIONS (prévol)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion DB avec PDO
try {
    $conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erreur DB: " . $e->getMessage()]);
    exit;
}

// Vérifier si l'id_connexion est stocké en session
if (isset($_SESSION['id_connexion'])) {
    $id_connexion = $_SESSION['id_connexion'];

    // Mise à jour de la déconnexion
    $stmt = $conn->prepare("UPDATE journal_connexions SET heure_deconnexion = NOW() WHERE id = :id");
    $stmt->bindParam(':id', $id_connexion, PDO::PARAM_INT);
    $stmt->execute();
}

// Nettoyage de session
session_unset();
session_destroy();

echo json_encode(["success" => true, "message" => "Déconnexion enregistrée avec succès."]);
?>
