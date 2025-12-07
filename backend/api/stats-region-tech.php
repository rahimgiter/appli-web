<?php
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "SELECT r.nom_region, t.libelle_type, COUNT(*) as total_sites
        FROM site s
        JOIN localite l ON s.id_localite = l.id_localite
        JOIN departement d ON l.id_departement = d.id_departement  
        JOIN province p ON d.id_province = p.id_province
        JOIN region r ON p.id_region = r.id_region
        JOIN type_site t ON s.id_type_site = t.id_type_site
        GROUP BY r.nom_region, t.libelle_type
        ORDER BY r.nom_region, t.libelle_type";

$result = $conn->query($sql);
$data = [];
while($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
?>