<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$id = $_GET['id'] ?? null;

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Version simple (moins sécurisée mais plus proche de l'original)
if ($id) {
    $res = $conn->query("SELECT * FROM ajout_infos WHERE id_localite = '$id' LIMIT 1");
    
    if ($res && $res->num_rows > 0) {
        echo json_encode($res->fetch_assoc());
    } else {
        echo json_encode([]);
    }
} else {
    echo json_encode(["error" => "ID manquant"]);
}

$conn->close();
?>