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

// Debug: Afficher le contenu de la session
error_log("Session content: " . print_r($_SESSION, true));

// Récupérer l'ID de connexion depuis la session ou les paramètres GET
$id_connexion = null;

if (isset($_SESSION['id_connexion'])) {
    $id_connexion = $_SESSION['id_connexion'];
    error_log("ID connexion trouvé en session: " . $id_connexion);
} elseif (isset($_GET['id_connexion'])) {
    $id_connexion = $_GET['id_connexion'];
    error_log("ID connexion trouvé en paramètre GET: " . $id_connexion);
} else {
    error_log("Aucun ID connexion trouvé");
}

// Mise à jour de la déconnexion si on a un ID
if ($id_connexion) {
    $stmt = $conn->prepare("UPDATE journal_connexions SET heure_deconnexion = NOW() WHERE id = :id");
    $stmt->bindParam(':id', $id_connexion, PDO::PARAM_INT);
    $result = $stmt->execute();
    
    if ($result) {
        error_log("Déconnexion mise à jour avec succès pour l'ID: " . $id_connexion);
    } else {
        error_log("Erreur lors de la mise à jour de la déconnexion");
    }
} else {
    error_log("Impossible de mettre à jour la déconnexion - aucun ID fourni");
}

// Nettoyage de session
session_unset();
session_destroy();

echo json_encode(["success" => true, "message" => "Déconnexion enregistrée avec succès."]);
?>
