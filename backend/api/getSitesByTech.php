<?php
header("Content-Type: application/json");
require_once 'cors.php';

try {
    $pdo = new PDO("mysql:host=localhost;dbname=reseau;charset=utf8mb4", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

$id_type_site = $_GET['id_type_site'] ?? null;

$sql = "SELECT s.*, 
        o.nom_operateur AS operateur_nom, 
        t.libelle_type, 
        l.nom_localite 
        FROM site s
        LEFT JOIN operateur o ON s.id_operateur = o.id_operateur
        LEFT JOIN type_site t ON s.id_type_site = t.id_type_site
        LEFT JOIN localite l ON s.id_localite = l.id_localite";

$params = [];

if ($id_type_site !== null) {
    if (!is_numeric($id_type_site)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid type_site ID"]);
        exit;
    }
    $sql .= " WHERE s.id_type_site = ?";
    $params[] = $id_type_site;
}

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sites = $stmt->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit;
}

// Retourner tableau vide et code 200 si pas de résultat
echo json_encode($sites, JSON_UNESCAPED_UNICODE);
exit;
