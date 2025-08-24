<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
require_once 'cors.php';

$conn = new mysqli("localhost", "root", "", "reseau");

$result = $conn->query("SELECT id_operateur, nom_operateur FROM operateur");

$ops = [];
while ($row = $result->fetch_assoc()) {
    $ops[] = $row;
}

echo json_encode($ops);
