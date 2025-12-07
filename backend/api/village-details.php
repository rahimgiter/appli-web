<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "reseau");

// Vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

$id = $_GET['id'] ?? 0;

$sql = "
SELECT 
    l.nom_localite, 
    l.latitude,
    l.longitude,
    l.hommes,
    l.femmes,
    l.pop_total,
    d.nom_departement,
    p.nom_province, 
    r.nom_region
FROM localite l
LEFT JOIN departement d ON l.id_departement = d.id_departement
LEFT JOIN province p ON d.id_province = p.id_province
LEFT JOIN region r ON p.id_region = r.id_region
WHERE l.id_localite = ?
LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($row = $res->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Localité introuvable"]);
}

$stmt->close();
$conn->close();
?>