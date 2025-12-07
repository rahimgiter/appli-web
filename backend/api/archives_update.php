<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

$conn = new mysqli("localhost", "root", "", "reseau");

// Lecture des données JSON
$data = json_decode(file_get_contents("php://input"), true);

// Vérification
if (!$data || !isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "Paramètres manquants"]);
    exit;
}

$id = $data['id'];
$site_2g = $data['site_2g'] ?? null;
$appel_possible = $data['appel_possible'] ?? null;
$operateurs_appel = isset($data['operateurs_appel']) ? $data['operateurs_appel'] : '';
$raison_pas_appel = $data['raison_pas_appel'] ?? null;
$qualite_2g = $data['qualite_2g'] ?? null;
$antenne = $data['antenne'] ?? null;
$raison_pas_antenne = $data['raison_pas_antenne'] ?? null;
$site_3g = $data['site_3g'] ?? null;
$internet = $data['internet'] ?? null;
$operateurs_internet = isset($data['operateurs_internet']) ? $data['operateurs_internet'] : '';
$qualite_internet = $data['qualite_internet'] ?? null;
$commentaire = $data['commentaire'] ?? null;
$id_utilisateur = isset($data['id_utilisateur']) ? $data['id_utilisateur'] : null;

// Requête préparée
$sql = "UPDATE ajout_infos SET 
    site_2g = ?, appel_possible = ?, operateurs_appel = ?, raison_pas_appel = ?, 
    qualite_2g = ?, antenne = ?, raison_pas_antenne = ?, site_3g = ?, internet = ?, 
    operateurs_internet = ?, qualite_internet = ?, commentaire = ?, etat = 'modifié'";

// Ajouter id_utilisateur si fourni
if ($id_utilisateur) {
    $sql .= ", id_utilisateur = ?";
}

$sql .= " WHERE id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Erreur de préparation : " . $conn->error]);
    exit;
}

// Binding des paramètres selon si id_utilisateur est fourni
if ($id_utilisateur) {
    $stmt->bind_param(
        "sssssssssssssi",
        $site_2g,
        $appel_possible,
        $operateurs_appel,
        $raison_pas_appel,
        $qualite_2g,
        $antenne,
        $raison_pas_antenne,
        $site_3g,
        $internet,
        $operateurs_internet,
        $qualite_internet,
        $commentaire,
        $id_utilisateur,
        $id
    );
} else {
    $stmt->bind_param(
        "ssssssssssssi",
        $site_2g,
        $appel_possible,
        $operateurs_appel,
        $raison_pas_appel,
        $qualite_2g,
        $antenne,
        $raison_pas_antenne,
        $site_3g,
        $internet,
        $operateurs_internet,
        $qualite_internet,
        $commentaire,
        $id
    );
}

if ($stmt->execute()) {
    // Récupérer les données mises à jour avec les informations utilisateur
    $updatedSql = "
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
    WHERE a.id = ?
    ";
    
    $updatedStmt = $conn->prepare($updatedSql);
    $updatedStmt->bind_param("i", $id);
    $updatedStmt->execute();
    $updatedResult = $updatedStmt->get_result();
    
    if ($updatedResult->num_rows > 0) {
        $updatedData = $updatedResult->fetch_assoc();
        
        // Créer le nom complet de l'auteur
        $updatedData['auteur'] = ($updatedData['prenom'] && $updatedData['nom_famille']) 
            ? $updatedData['prenom'] . ' ' . $updatedData['nom_famille'] 
            : 'Utilisateur';
        
        // Nettoyer les données inutiles
        unset($updatedData['prenom']);
        unset($updatedData['nom_famille']);
        
        echo json_encode([
            "success" => true, 
            "message" => "Formulaire mis à jour avec succès",
            "updatedData" => $updatedData
        ]);
    } else {
        echo json_encode([
            "success" => true, 
            "message" => "Formulaire mis à jour mais erreur lors de la récupération des données"
        ]);
    }
    
    $updatedStmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Erreur exécution : " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>