<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

$id_region = $_GET['id_region'] ?? null;

if ($id_region) {
    $stmt = $conn->prepare("
        SELECT v.*
        FROM village v
        JOIN commune c ON v.id_commune = c.id_commune
        JOIN province p ON c.id_province = p.id_province
        WHERE p.id_region = ?
    ");
    $stmt->bind_param("i", $id_region);
    $stmt->execute();
    $res = $stmt->get_result();
    $villages = [];
    while ($row = $res->fetch_assoc()) {
        $villages[] = $row;
    }
    echo json_encode($villages);
} else {
    echo json_encode([]);
}
$conn->close();
