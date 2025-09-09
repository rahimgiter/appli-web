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
if (!$data) {
    echo json_encode(["success" => false, "message" => "Données invalides ou absentes"]);
    exit();
}

// Connexion à la base de données
$conn = new mysqli("localhost", "root", "", "reseau");
$conn->set_charset("utf8");

// Vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion : " . $conn->connect_error]);
    exit();
}

// ✅ Récupérer chaque champ avec fallback
$id_village          = $data['id_village'] ?? null;
$site_2g             = $data['site_2g'] ?? '';
$appel_possible      = $data['appel_possible'] ?? '';
$operateurs_appel    = $data['operateurs_appel'] ?? '';
$raison_pas_appel    = $data['raison_pas_appel'] ?? '';
$qualite_2g          = $data['qualite_2g'] ?? '';
$antenne             = $data['antenne'] ?? '';
$raison_pas_antenne  = $data['raison_pas_antenne'] ?? '';
$site_3g             = $data['site_3g'] ?? '';
$internet            = $data['internet'] ?? '';
$operateurs_internet = $data['operateurs_internet'] ?? '';
$qualite_internet    = $data['qualite_internet'] ?? '';
$commentaire         = $data['commentaire'] ?? '';

// Vérification simple des champs obligatoires
if (!$id_village || !$site_2g || !$internet) {
    echo json_encode(["success" => false, "message" => "Champs obligatoires manquants"]);
    exit();
}

// Préparer la requête
$stmt = $conn->prepare("INSERT INTO ajout_infos 
    (id_village, site_2g, appel_possible, operateurs_appel, raison_pas_appel, qualite_2g, antenne, raison_pas_antenne, site_3g, internet, operateurs_internet, qualite_internet, commentaire) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

// Associer les paramètres
$stmt->bind_param(
    "issssssssssss",
    $id_village, $site_2g, $appel_possible, $operateurs_appel,
    $raison_pas_appel, $qualite_2g, $antenne, $raison_pas_antenne,
    $site_3g, $internet, $operateurs_internet, $qualite_internet, $commentaire
);

// Exécuter et retourner la réponse
if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
