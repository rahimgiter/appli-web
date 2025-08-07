<?php
// CORS headers à mettre en tout début de fichier (avant tout echo)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Réponse rapide à la requête OPTIONS (= pré-vol)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion base de données
$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion à la base de données"]);
    exit;
}

// Récupérer les données JSON envoyées
$data = json_decode(file_get_contents("php://input"), true);

if (
    !isset($data['nom_site'], $data['latitude_site'], $data['longitude_site'], 
           $data['id_localite'], $data['id_operateur'], $data['id_type_site'],
           $data['annee_site'], $data['id_trimestre'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Champs manquants"]);
    exit;
}

$nom = $data['nom_site'];
$lat = $data['latitude_site'];
$lon = $data['longitude_site'];
$id_localite = $data['id_localite'];
$id_operateur = $data['id_operateur'];
$id_type_site = $data['id_type_site'];
$annee = $data['annee_site'];
$id_trimestre = $data['id_trimestre'];

// Préparer la requête SQL
$sql = "INSERT INTO site (nom_site, latitude_site, longitude_site, id_localite, id_operateur, id_type_site, annee_site, id_trimestre)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur dans la requête SQL : " . $conn->error]);
    exit;
}

$stmt->bind_param("sddiiisi", $nom, $lat, $lon, $id_localite, $id_operateur, $id_type_site, $annee, $id_trimestre);

if ($stmt->execute()) {
    echo json_encode(["message" => "✅ Site ajouté avec succès"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "❌ Échec de l'ajout du site : " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
