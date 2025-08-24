<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "
SELECT 
  a.*, 
  v.nom_village, 
  c.nom_commune, 
  p.nom_province, 
  r.nom_region
FROM ajout_infos a
JOIN village v ON a.id_village = v.id_village
JOIN commune c ON v.id_commune = c.id_commune
JOIN province p ON c.id_province = p.id_province
JOIN region r ON p.id_region = r.id_region
ORDER BY a.created_at DESC
";

$res = $conn->query($sql);
$data = [];

while ($row = $res->fetch_assoc()) {
  $data[] = $row;
}

echo json_encode($data);
