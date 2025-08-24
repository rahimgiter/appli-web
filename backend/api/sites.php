<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

try {
    $sql = "SELECT * FROM site ORDER BY nom_site ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($sites);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur serveur"]);
}
