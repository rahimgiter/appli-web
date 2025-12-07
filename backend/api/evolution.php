<?php
// CORS EN PREMIER
require_once 'cors.php';

// DB EN SECOND
include 'db.php';

$sql = "
    SELECT 
        s.annee_site,
        t.libelle_trimestre,
        COUNT(s.id_site) AS total
    FROM site s
    JOIN trimestre t ON s.id_trimestre = t.id_trimestre
    GROUP BY s.annee_site, s.id_trimestre
    ORDER BY s.annee_site, s.id_trimestre
";

try {
    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Header JSON explicite
    header('Content-Type: application/json; charset=utf-8');
    
    echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erreur base de données']);
}
// PAS de ?>