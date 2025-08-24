<?php
// 🔒 Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connexion échouée"]);
    exit;
}

$conditions = [];
$params = [];
$types = "";

if (!empty($_GET['utilisateur'])) {
    $conditions[] = "u.nom_famille LIKE ?";
    $params[] = "%" . $_GET['utilisateur'] . "%";
    $types .= "s";
}

if (!empty($_GET['date'])) {
    $conditions[] = "DATE(j.heure_connexion) = ?";
    $params[] = $_GET['date'];
    $types .= "s";
}

$sql = "
  SELECT j.id, u.nom_famille, u.prenom, u.fonction, u.role, j.heure_connexion, j.heure_deconnexion
  FROM journal_connexions j
  JOIN utilisateur u ON j.id_utilisateur = u.id_utilisateur
";

if (!empty($conditions)) {
    $sql .= " WHERE " . implode(" AND ", $conditions);
}

$sql .= " ORDER BY j.heure_connexion DESC";

$stmt = $conn->prepare($sql);
if ($types !== "") {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
