<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Connexion à la base
$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

// Récupérer les logs avec les infos de l'utilisateur
$sql = "
    SELECT jc.id, u.nom_famille, u.prenom, u.fonction, u.role, jc.heure_connexion, jc.heure_deconnexion
    FROM journal_connexions jc
    JOIN utilisateur u ON jc.id_utilisateur = u.id_utilisateur
    ORDER BY jc.heure_connexion DESC
";
$result = $conn->query($sql);

$logs = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
}

echo json_encode($logs);

$conn->close();
?>
