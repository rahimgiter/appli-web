<?php
// CORS TOUJOURS EN PREMIER
require_once 'cors.php';

// DB EN SECOND
include 'db.php';

$sql = "
    SELECT 
        d.nom_departement,
        COUNT(s.id_site) AS total_sites
    FROM site s
    JOIN localite l ON s.id_localite = l.id_localite
    JOIN departement d ON l.id_departement = d.id_departement
    GROUP BY d.id_departement, d.nom_departement
    ORDER BY total_sites DESC
    LIMIT 10
";

try {
    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // HEADER JSON EXPLICITE
    header('Content-Type: application/json; charset=utf-8');
    
    // ENCODAGE JSON AVEC OPTIONS
    echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
} catch (PDOException $e) {
    // HEADER JSON MÊME EN CAS D'ERREUR
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données']);
}
// NE PAS METTRE DE ?>