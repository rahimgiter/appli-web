<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once 'cors.php';

// Connexion
$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Erreur de connexion à la base de données"]);
  exit;
}

// Requête mise à jour pour la table "trimestre"
$sql = "SELECT id_trimestre, libelle_trimestre FROM trimestre ORDER BY id_trimestre";
$result = $conn->query($sql);

// Traitement résultat
$data = [];
while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
$conn->close();
