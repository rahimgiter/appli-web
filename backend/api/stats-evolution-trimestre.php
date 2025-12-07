<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "SELECT s.annee_site, s.id_trimestre, t.libelle_type, COUNT(*) as nouveaux_sites
        FROM site s
        JOIN type_site t ON s.id_type_site = t.id_type_site
        GROUP BY s.annee_site, s.id_trimestre, t.libelle_type
        ORDER BY s.annee_site, s.id_trimestre, t.libelle_type";

$result = $conn->query($sql);
$data = [];
while($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
?>