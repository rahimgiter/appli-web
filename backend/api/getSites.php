<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Erreur de connexion à la base de données"]);
  exit;
}

$sql = "SELECT s.id_site,
               s.nom_site,
               s.latitude_site,
               s.longitude_site,
               l.nom_localite,
               o.nom_operateur,
               t.libelle_type AS type_site
        FROM site s
        JOIN localite l ON s.id_localite = l.id_localite
        JOIN operateur o ON s.id_operateur = o.id_operateur
        JOIN type_site t ON s.id_type_site = t.id_type_site
        ORDER BY s.id_site DESC";

$result = $conn->query($sql);
$data = [];

if ($result && $result->num_rows > 0) {
  while ($row = $result->fetch_assoc()) {
    $data[] = $row;
  }
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
$conn->close();
?>
