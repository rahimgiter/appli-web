<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$id = $_GET['id'] ?? null;

$conn = new mysqli("localhost", "root", "", "reseau");

$res = $conn->query("SELECT * FROM ajout_infos WHERE id_village = '$id' LIMIT 1");

if ($res && $res->num_rows > 0) {
    echo json_encode($res->fetch_assoc());
} else {
    echo json_encode([]);
}

$conn->close();
