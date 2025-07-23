<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "reseau");

$id = $_GET['id'] ?? 0;

$sql = "
SELECT 
    v.nom_village, 
    v.latitude,
    v.longitude,
    v.hommes,
    v.femmes,
    v.pop_total,
    c.nom_commune, 
    p.nom_province, 
    r.nom_region
FROM village v
JOIN commune c ON v.id_commune = c.id_commune
JOIN province p ON c.id_province = p.id_province
JOIN region r ON p.id_region = r.id_region
WHERE v.id_village = ?
LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($row = $res->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Village introuvable"]);
}
?>
