<?php
// DÉBUT ABSOLU du fichier - AUCUN espace avant
require_once 'cors.php';
include 'db.php';

// Désactiver l'affichage des erreurs en production
error_reporting(0);
ini_set('display_errors', 0);

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
    
    // S'assurer qu'aucun output n'a été envoyé avant
    if (ob_get_length()) ob_clean();
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erreur base de données']);
}
?>