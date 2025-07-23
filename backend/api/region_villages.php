<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

$id_region = $_GET['id_region'] ?? null;

if (!$id_region) {
    echo json_encode([]);
    exit;
}

// Requête : région → province → commune → village
$query = "
SELECT 
    v.id_village,
    v.nom_village,
    v.latitude,
    v.longitude,
    v.pop_total,
    c.nom_commune,
    p.nom_province
FROM village v
JOIN commune c ON v.id_commune = c.id_commune
JOIN province p ON c.id_province = p.id_province
WHERE p.id_region = ?
ORDER BY v.nom_village
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $id_region);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
