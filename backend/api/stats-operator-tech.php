<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "SELECT o.nom_operateur, t.libelle_type, COUNT(*) as total_sites
        FROM site s
        JOIN operateur o ON s.id_operateur = o.id_operateur
        JOIN type_site t ON s.id_type_site = t.id_type_site
        GROUP BY o.nom_operateur, t.libelle_type
        ORDER BY o.nom_operateur, t.libelle_type";

$result = $conn->query($sql);
$data = [];
while($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
?>