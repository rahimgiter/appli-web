<?php
include 'db.php';
require_once 'cors.php';

$sql = "
    SELECT ts.libelle_type, COUNT(s.id_site) AS total
    FROM site s
    JOIN type_site ts ON s.id_type_site = ts.id_type_site
    GROUP BY ts.libelle_type
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