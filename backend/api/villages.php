<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

$id_commune = $_GET['id_commune'] ?? null;

if ($id_commune) {
    $stmt = $conn->prepare("SELECT * FROM village WHERE id_commune = ?");
    $stmt->bind_param("s", $id_commune);
    $stmt->execute();
    $res = $stmt->get_result();
} else {
    $res = $conn->query("SELECT * FROM village");
}

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
