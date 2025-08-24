<?php
$host = "localhost";
$dbname = "reseau";
$username = "root"; // ou ton utilisateur MySQL
$password = ""; // ton mot de passe MySQL

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur connexion BDD : " . $e->getMessage()]);
    exit;
}
