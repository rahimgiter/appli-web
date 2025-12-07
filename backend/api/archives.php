<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");

if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Requête avec jointure pour récupérer le nom et prénom de l'utilisateur
$sql = "
SELECT 
  a.*, 
  l.nom_localite, 
  d.nom_departement, 
  p.nom_province, 
  r.nom_region,
  u.prenom,
  u.nom_famille
FROM ajout_infos a
JOIN localite l ON a.id_localite = l.id_localite
JOIN departement d ON l.id_departement = d.id_departement
JOIN province p ON d.id_province = p.id_province
JOIN region r ON p.id_region = r.id_region
LEFT JOIN utilisateur u ON a.id_utilisateur = u.id_utilisateur
ORDER BY a.created_at DESC
";

$res = $conn->query($sql);

$data = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        // Créer le nom complet de l'auteur
        $row['auteur'] = $row['prenom'] && $row['nom_famille'] 
            ? $row['prenom'] . ' ' . $row['nom_famille'] 
            : 'Utilisateur';
        
        // Nettoyer les données inutiles
        unset($row['prenom']);
        unset($row['nom_famille']);
        
        $data[] = $row;
    }
    echo json_encode($data);
} else {
    echo json_encode(["status" => "error", "message" => "Erreur dans la requête SQL : " . $conn->error]);
}

$conn->close();
?>