<?php
include 'db.php';
require_once 'cors.php';
$sql = "
    SELECT o.nom_operateur, COUNT(s.id_site) AS total
    FROM site s
    JOIN operateur o ON s.id_operateur = o.id_operateur
    GROUP BY o.nom_operateur
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