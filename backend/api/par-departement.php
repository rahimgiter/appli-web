<?php
include 'db.php';
require_once 'cors.php';

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
    echo json_encode($results);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>