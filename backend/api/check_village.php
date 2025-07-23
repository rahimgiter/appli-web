<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

$id = $_GET['id'] ?? 0;

$stmt = $conn->prepare("SELECT id FROM ajout_infos WHERE id_village = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
  echo json_encode(["exists" => true]);
} else {
  echo json_encode(["exists" => false]);
}
