<?php
// CORS & JSON headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Connexion à la base de données
try {
    $conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupération possible de l'ID région en GET
    $id_region = isset($_GET['id_region']) ? intval($_GET['id_region']) : null;

    if ($id_region) {
        $stmt = $conn->prepare("SELECT * FROM province WHERE id_region = ?");
        $stmt->execute([$id_region]);
    } else {
        $stmt = $conn->query("SELECT * FROM province");
    }

    $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($provinces);
    
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
    http_response_code(500);
}
?>
