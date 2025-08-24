<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require 'config.php';

$regionId = (int)($_GET['id_region'] ?? 0);

try {
    $pdo = new PDO($dsn, $user, $password);
    
    $query = "SELECT 
                v.id_village,
                v.nom_village,
                v.pop_total,
                c.nom_commune,
                p.nom_province
              FROM village v
              JOIN commune c ON v.id_commune = c.id_commune
              JOIN province p ON c.id_province = p.id_province
              WHERE p.id_region = :regionId
              ORDER BY v.nom_village";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':regionId', $regionId, PDO::PARAM_INT);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Garantir qu'on retourne toujours un tableau
    echo json_encode($results ?: []);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>