<?php
// Autoriser les requêtes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'cors.php';

try {
    // Connexion à la base de données avec PDO
    $pdo = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si l'ID de la province est passé
    if (!isset($_GET['id_province'])) {
        echo json_encode(["error" => "Paramètre 'id_province' manquant."]);
        http_response_code(400);
        exit;
    }

    $id_province = intval($_GET['id_province']);

    // Requête SQL avec jointures
    $sql = "
        SELECT s.*, l.nom_localite, d.nom_departement, p.nom_province, 
               o.nom_operateur, t.libelle_type, tri.libelle_trimestre
        FROM site s
        JOIN localite l ON s.id_localite = l.id_localite
        JOIN departement d ON l.id_departement = d.id_departement
        JOIN province p ON d.id_province = p.id_province
        LEFT JOIN operateur o ON s.id_operateur = o.id_operateur
        LEFT JOIN type_site t ON s.id_type_site = t.id_type_site
        LEFT JOIN trimestre tri ON s.id_trimestre = tri.id_trimestre
        WHERE p.id_province = :id_province
        ORDER BY s.nom_site ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":id_province", $id_province, PDO::PARAM_INT);
    $stmt->execute();

    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($sites);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
