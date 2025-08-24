<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'cors.php';

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Récupérer les filtres depuis l'URL
$id_region = isset($_GET['id_region']) ? intval($_GET['id_region']) : null;
$id_province = isset($_GET['id_province']) ? intval($_GET['id_province']) : null;
$id_departement = isset($_GET['id_departement']) ? intval($_GET['id_departement']) : null;
$id_localite = isset($_GET['id_localite']) ? intval($_GET['id_localite']) : null;

// Construction dynamique de la requête
$sql = "
    SELECT 
        s.id_site,
        s.nom_site,
        s.latitude_site,
        s.longitude_site,
        l.nom_localite,
        c.nom_departement,
        p.nom_province,
        r.nom_region,
        o.nom_operateur,
        ts.libelle_type,
        s.annee_site,
        t.libelle_trimestre
    FROM site s
    JOIN localite l ON s.id_localite = l.id_localite
    JOIN departement c ON l.id_departement = c.id_departement
    JOIN province p ON c.id_province = p.id_province
    JOIN region r ON p.id_region = r.id_region
    JOIN operateur o ON s.id_operateur = o.id_operateur
    JOIN type_site ts ON s.id_type_site = ts.id_type_site
    JOIN trimestre t ON s.id_trimestre = t.id_trimestre
    WHERE 1=1
";

// Ajout des conditions dynamiquement
if ($id_region) {
    $sql .= " AND r.id_region = $id_region";
}
if ($id_province) {
    $sql .= " AND p.id_province = $id_province";
}
if ($id_departement) {
    $sql .= " AND c.id_departement = $id_departement";
}
if ($id_localite) {
    $sql .= " AND l.id_localite = $id_localite";
}

$result = $conn->query($sql);

$sites = [];
while ($row = $result->fetch_assoc()) {
    $sites[] = $row;
}

echo json_encode($sites);
$conn->close();
