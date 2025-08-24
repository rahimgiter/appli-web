<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'cors.php';

$conn = new mysqli("localhost", "root", "", "reseau");

$result = $conn->query("SELECT * FROM utilisateur ORDER BY id_utilisateur DESC");
$users = [];

while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);
$conn->close();
