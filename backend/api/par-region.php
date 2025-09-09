<?php
include 'db.php';
require_once 'cors.php';
$sql = "
    SELECT 
        r.nom_region,
        COUNT(s.id_site) AS total
    FROM site s
    JOIN localite l ON s.id_localite = l.id_localite
    JOIN departement d ON l.id_departement = d.id_departement
    JOIN province p ON d.id_province = p.id_province
    JOIN region r ON p.id_region = r.id_region
    GROUP BY r.nom_region
    ORDER BY total DESC
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