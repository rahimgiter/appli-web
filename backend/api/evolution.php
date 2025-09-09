<?php
include 'db.php';
require_once 'cors.php';

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
    echo json_encode($results);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>