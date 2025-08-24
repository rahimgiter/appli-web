<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "reseau");

// Lire les données JSON du POST
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id_village'])) {
    echo json_encode(["error" => "Paramètres invalides"]);
    exit;
}

$id_village = $data['id_village']; // ✅ important à ajouter

// Vérifier si le village a déjà été renseigné
$check = $conn->prepare("SELECT id FROM ajout_infos WHERE id_village = ?");
$check->bind_param("i", $id_village);
$check->execute();
$checkResult = $check->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Ce village a déjà été renseigné."]);
    exit;
}

// Préparer les champs facultatifs
$operateurs_appel = isset($data['operateurs_appel']) ? implode(',', $data['operateurs_appel']) : '';
$operateurs_internet = isset($data['operateurs_internet']) ? implode(',', $data['operateurs_internet']) : '';
$raison_pas_antenne = isset($data['raison_pas_antenne']) ? $data['raison_pas_antenne'] : '';

// Insertion des données
$stmt = $conn->prepare("
    INSERT INTO ajout_infos (
        id_village, site_2g, appel_possible, operateurs_appel, raison_pas_appel, 
        qualite_2g, antenne, raison_pas_antenne, site_3g, internet, 
        operateurs_internet, qualite_internet, commentaire
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "issssssssssss",
    $id_village,
    $data['site_2g'],
    $data['appel_possible'],
    $operateurs_appel,
    $data['raison_pas_appel'],
    $data['qualite_2g'],
    $data['antenne'],
    $raison_pas_antenne,
    $data['site_3g'],
    $data['internet'],
    $operateurs_internet,
    $data['qualite_internet'],
    $data['commentaire']
);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Données enregistrées"]);
} else {
    echo json_encode(["status" => "error", "message" => "Échec d'enregistrement"]);
}

$stmt->close();
$conn->close();