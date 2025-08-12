<?php
// Autoriser les requêtes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'cors.php';
try {
    // Connexion à la base de données avec PDO
    $pdo = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si l'ID de la région est passé
    if (!isset($_GET['id_region'])) {
        echo json_encode(["error" => "Paramètre 'id_region' manquant."]);
        http_response_code(400);
        exit;
    }

    $id_region = intval($_GET['id_region']);

    // Requête SQL avec jointures pour récupérer les sites selon la région
    $sql = "
        SELECT s.*, l.nom_localite, d.nom_departement, p.nom_province, r.nom_region, 
               o.nom_operateur, t.libelle_type, tri.libelle_trimestre
        FROM site s
        JOIN localite l ON s.id_localite = l.id_localite
        JOIN departement d ON l.id_departement = d.id_departement
        JOIN province p ON d.id_province = p.id_province
        JOIN region r ON p.id_region = r.id_region
        LEFT JOIN operateur o ON s.id_operateur = o.id_operateur
        LEFT JOIN type_site t ON s.id_type_site = t.id_type_site
        LEFT JOIN trimestre tri ON s.id_trimestre = tri.id_trimestre
        WHERE r.id_region = :id_region
        ORDER BY s.nom_site ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id_region", $id_region, PDO::PARAM_INT);
    $stmt->execute();

    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($sites);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
