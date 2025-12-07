<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "reseau");

// Vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Lire les données JSON du POST
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id_localite'])) {
    echo json_encode(["error" => "Paramètres invalides - ID localité manquant"]);
    exit;
}

$id_localite = $data['id_localite'];
$id_utilisateur = isset($data['id_utilisateur']) ? $data['id_utilisateur'] : null;

// Vérifier si la localité a déjà été renseignée
$check = $conn->prepare("SELECT id FROM ajout_infos WHERE id_localite = ?");
$check->bind_param("i", $id_localite);
$check->execute();
$checkResult = $check->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Cette localité a déjà été renseignée."]);
    exit;
}

// Préparer les champs facultatifs
$operateurs_appel = isset($data['operateurs_appel']) ? implode(',', $data['operateurs_appel']) : '';
$operateurs_internet = isset($data['operateurs_internet']) ? implode(',', $data['operateurs_internet']) : '';
$raison_pas_antenne = isset($data['raison_pas_antenne']) ? $data['raison_pas_antenne'] : '';
$raison_pas_appel = isset($data['raison_pas_appel']) ? $data['raison_pas_appel'] : '';
$qualite_internet = isset($data['qualite_internet']) ? $data['qualite_internet'] : '';
$site_3g = isset($data['site_3g']) ? $data['site_3g'] : '';
$commentaire = isset($data['commentaire']) ? $data['commentaire'] : '';

// Vérifier si la colonne id_utilisateur existe dans la table
$checkColumn = $conn->query("SHOW COLUMNS FROM ajout_infos LIKE 'id_utilisateur'");
$hasUtilisateurColumn = $checkColumn->num_rows > 0;

if ($hasUtilisateurColumn && $id_utilisateur) {
    // Insertion avec id_utilisateur
    $stmt = $conn->prepare("
        INSERT INTO ajout_infos (
            id_localite, id_utilisateur, site_2g, appel_possible, operateurs_appel, raison_pas_appel, 
            qualite_2g, antenne, raison_pas_antenne, site_3g, internet, 
            operateurs_internet, qualite_internet, commentaire
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "iissssssssssss",
        $id_localite,
        $id_utilisateur,
        $data['site_2g'],
        $data['appel_possible'],
        $operateurs_appel,
        $raison_pas_appel,
        $data['qualite_2g'],
        $data['antenne'],
        $raison_pas_antenne,
        $site_3g,
        $data['internet'],
        $operateurs_internet,
        $qualite_internet,
        $commentaire
    );
} else {
    // Insertion sans id_utilisateur (pour compatibilité)
    $stmt = $conn->prepare("
        INSERT INTO ajout_infos (
            id_localite, site_2g, appel_possible, operateurs_appel, raison_pas_appel, 
            qualite_2g, antenne, raison_pas_antenne, site_3g, internet, 
            operateurs_internet, qualite_internet, commentaire
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "issssssssssss",
        $id_localite,
        $data['site_2g'],
        $data['appel_possible'],
        $operateurs_appel,
        $raison_pas_appel,
        $data['qualite_2g'],
        $data['antenne'],
        $raison_pas_antenne,
        $site_3g,
        $data['internet'],
        $operateurs_internet,
        $qualite_internet,
        $commentaire
    );
}

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Données enregistrées avec succès"]);
} else {
    echo json_encode(["status" => "error", "message" => "Échec d'enregistrement: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>