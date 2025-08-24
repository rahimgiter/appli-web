<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "reseau");

$result = $conn->query("SELECT COUNT(*) AS total FROM ajout_infos");
$row = $result->fetch_assoc();

echo json_encode(["total" => intval($row['total'])]);
