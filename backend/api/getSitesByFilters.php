<?php
// Afficher les erreurs (uniquement en développement)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once 'cors.php';
// Connexion à la base de données
include 'db.php';

// Récupération des filtres (tous optionnels)
$id_region       = isset($_GET['id_region']) ? (int)$_GET['id_region'] : null;
$id_province     = isset($_GET['id_province']) ? (int)$_GET['id_province'] : null;
$id_departement  = isset($_GET['id_departement']) ? (int)$_GET['id_departement'] : null;
$id_localite     = isset($_GET['id_localite']) ? (int)$_GET['id_localite'] : null;
$id_operateur    = isset($_GET['id_operateur']) ? (int)$_GET['id_operateur'] : null;
$id_type_site    = isset($_GET['id_type_site']) ? (int)$_GET['id_type_site'] : null;

try {
    // === Construction dynamique de la requête avec les bonnes tables (sans "s") ===
    $sql = "
        SELECT 
            s.id_site,
            s.nom_site,
            s.latitude_site,
            s.longitude_site,
            s.annee_site,
            s.id_localite,
            s.id_operateur,
            s.id_type_site,
            s.id_trimestre,
            
            l.nom_localite,
            d.nom_departement,
            p.nom_province,
            r.nom_region,
            o.nom_operateur,
            t.libelle_type,
            tr.libelle_trimestre
        FROM site s
        INNER JOIN localite l ON s.id_localite = l.id_localite
        INNER JOIN departement d ON l.id_departement = d.id_departement
        INNER JOIN province p ON d.id_province = p.id_province
        INNER JOIN region r ON p.id_region = r.id_region
        INNER JOIN operateur o ON s.id_operateur = o.id_operateur
        INNER JOIN type_site t ON s.id_type_site = t.id_type_site
        INNER JOIN trimestre tr ON s.id_trimestre = tr.id_trimestre
        WHERE 1=1
    ";

    $params = [];

    // === Filtre géographique (priorité : le plus spécifique) ===
    if ($id_localite !== null) {
        $sql .= " AND l.id_localite = :id_localite";
        $params[':id_localite'] = $id_localite;
    } elseif ($id_departement !== null) {
        $sql .= " AND d.id_departement = :id_departement";
        $params[':id_departement'] = $id_departement;
    } elseif ($id_province !== null) {
        $sql .= " AND p.id_province = :id_province";
        $params[':id_province'] = $id_province;
    } elseif ($id_region !== null) {
        $sql .= " AND r.id_region = :id_region";
        $params[':id_region'] = $id_region;
    }

    // === Filtres additionnels ===
    if ($id_operateur !== null) {
        $sql .= " AND s.id_operateur = :id_operateur";
        $params[':id_operateur'] = $id_operateur;
    }

    if ($id_type_site !== null) {
        $sql .= " AND s.id_type_site = :id_type_site";
        $params[':id_type_site'] = $id_type_site;
    }

    // Préparation et exécution
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_INT);
    }
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retour JSON
    echo json_encode($result, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // En cas d'erreur (ex: table inexistante, colonne inconnue)
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur serveur",
        "details" => $e->getMessage(),
        "sql" => $sql ?? null,
        "params" => $params ?? []
    ]);
}
?>