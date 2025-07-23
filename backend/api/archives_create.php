<?php
// ✅ Autoriser les requêtes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

// ✅ Gérer les requêtes préflight CORS (méthode OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Lire les données JSON du body
$data = json_decode(file_get_contents("php://input"), true);

// Connexion à la base de données
$conn = new mysqli("localhost", "root", "", "reseau");

// Sécurité : vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion : " . $conn->connect_error]);
    exit();
}

// Préparer la requête
$stmt = $conn->prepare("INSERT INTO ajout_infos 
    (id_village, site_2g, appel_possible, operateurs_appel, raison_pas_appel, qualite_2g, antenne, raison_pas_antenne, site_3g, internet, operateurs_internet, qualite_internet, commentaire) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

// Associer les paramètres
$stmt->bind_param("issssssssssss",
    $data['id_village'], $data['site_2g'], $data['appel_possible'], $data['operateurs_appel'],
    $data['raison_pas_appel'], $data['qualite_2g'], $data['antenne'], $data['raison_pas_antenne'],
    $data['site_3g'], $data['internet'], $data['operateurs_internet'], $data['qualite_internet'], $data['commentaire']
);

// Exécuter et retourner la réponse
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
