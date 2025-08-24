<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "SELECT COUNT(*) as count FROM ajout_infos WHERE vu = 0"; // vu = 0 si non lu
$res = $conn->query($sql);
$row = $res->fetch_assoc();

echo json_encode(["count" => $row['count'] ?? 0]);
