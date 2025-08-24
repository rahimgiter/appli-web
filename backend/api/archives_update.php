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

// Requête préparée
$sql = "UPDATE ajout_infos SET 
    site_2g = ?, appel_possible = ?, operateurs_appel = ?, raison_pas_appel = ?, 
    qualite_2g = ?, antenne = ?, raison_pas_antenne = ?, site_3g = ?, internet = ?, 
    operateurs_internet = ?, qualite_internet = ?, commentaire = ?, etat = 'modifié' 
    WHERE id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Erreur de préparation : " . $conn->error]);
    exit;
}

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

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erreur exécution : " . $stmt->error]);
}

$stmt->close();
$conn->close();
