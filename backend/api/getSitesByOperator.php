<?php
header("Content-Type: application/json");
require_once 'cors.php';

// Connexion mysqli
$conn = new mysqli("localhost", "root", "", "reseau");

// Vérification connexion
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Récupérer le paramètre id_operateur (optionnel)
$id_operateur = $_GET['id_operateur'] ?? null;

$sql = "SELECT s.*, 
        o.nom_operateur, 
        t.libelle_type, 
        l.nom_localite 
        FROM site s
        LEFT JOIN operateur o ON s.id_operateur = o.id_operateur
        LEFT JOIN type_site t ON s.id_type_site = t.id_type_site
        LEFT JOIN localite l ON s.id_localite = l.id_localite";

if ($id_operateur !== null) {
    if (!is_numeric($id_operateur)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid id_operateur"]);
        exit;
    }
    $sql .= " WHERE s.id_operateur = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $id_operateur);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => "Query failed: " . $conn->error]);
        exit;
    }
}

$sites = [];
while ($row = $result->fetch_assoc()) {
    $sites[] = $row;
}

echo json_encode($sites, JSON_UNESCAPED_UNICODE);
