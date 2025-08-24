<?php
// Autoriser les requêtes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'cors.php';
try {
    // Connexion à la base de données avec PDO
    $pdo = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si l'ID de la localité est fourni
    if (!isset($_GET['id_localite'])) {
        echo json_encode(["error" => "Paramètre 'id_localite' manquant."]);
        http_response_code(400);
        exit;
    }

    $id_localite = intval($_GET['id_localite']);

    // Requête SQL avec jointures
    $sql = "
        SELECT s.*, l.nom_localite, d.nom_departement, 
               o.nom_operateur, t.libelle_type, tri.libelle_trimestre
        FROM site s
        JOIN localite l ON s.id_localite = l.id_localite
        JOIN departement d ON l.id_departement = d.id_departement
        LEFT JOIN operateur o ON s.id_operateur = o.id_operateur
        LEFT JOIN type_site t ON s.id_type_site = t.id_type_site
        LEFT JOIN trimestre tri ON s.id_trimestre = tri.id_trimestre
        WHERE s.id_localite = :id_localite
        ORDER BY s.nom_site ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id_localite", $id_localite, PDO::PARAM_INT);
    $stmt->execute();

    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($sites);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>