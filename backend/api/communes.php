<?php
// CORS & JSON headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Connexion à la base de données
try {
    $conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupération possible de l'ID province en GET
    $id_province = isset($_GET['id_province']) ? intval($_GET['id_province']) : null;

    if ($id_province) {
        $stmt = $conn->prepare("SELECT * FROM commune WHERE id_province = ?");
        $stmt->execute([$id_province]);
    } else {
        $stmt = $conn->query("SELECT * FROM commune");
    }

    $communes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($communes);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
    http_response_code(500);
}
?>
