<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once 'cors.php';

// Connexion à la base de données
$conn = new mysqli("localhost", "root", "", "reseau");

// Vérification de la connexion
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Requête SQL
$sql = "
    SELECT 
        s.id_site,
        s.nom_site,
        s.latitude_site,
        s.longitude_site,
        l.nom_localite,
        o.nom_operateur,
        t.libelle_type,
        s.annee_site,
        sem.libelle_trimestre
    FROM site s
    INNER JOIN localite l ON s.id_localite = l.id_localite
    INNER JOIN operateur o ON s.id_operateur = o.id_operateur
    INNER JOIN type_site t ON s.id_type_site = t.id_type_site
    INNER JOIN trimestre sem ON s.id_trimestre = sem.id_trimestre
    ORDER BY s.id_site DESC
";

// Exécution de la requête
$result = $conn->query($sql);

// Vérifie si la requête a échoué
if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur dans la requête SQL : " . $conn->error]);
    exit;
}

// Préparer les données
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// Toujours retourner un tableau JSON (même s'il est vide)
echo json_encode($data, JSON_UNESCAPED_UNICODE);

// Fermer la connexion
$conn->close();
?>
