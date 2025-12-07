<?php
// Fichier cors.php FIRST
require_once 'cors.php';

// Ensuite db.php
include 'db.php';

// SQL query
$sql = "
    SELECT o.nom_operateur, COUNT(s.id_site) AS total
    FROM site s
    JOIN operateur o ON s.id_operateur = o.id_operateur
    GROUP BY o.nom_operateur
";

try {
    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // FORCER le Content-Type JSON
    header('Content-Type: application/json; charset=utf-8');
    
    // Encoder et vérifier
    $json = json_encode($results, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
    if ($json === false) {
        throw new Exception('JSON encoding failed');
    }
    
    echo $json;
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Database error']);
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Server error']);
}
// PAS de ?> 
