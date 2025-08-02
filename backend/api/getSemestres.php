<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Erreur de connexion à la base de données"]);
  exit;
}

$sql = "SELECT * FROM semestre ORDER BY id_semestre";
$result = $conn->query($sql);

$data = [];
while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
$conn->close();
?>
