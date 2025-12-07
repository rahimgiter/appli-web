<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

// Connexion DB
$conn = new mysqli("localhost", "root", "", "reseau");

// Vérifier la connexion
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion à la base de données"]);
    exit;
}

// Lire les données JSON
$data = json_decode(file_get_contents("php://input"), true);

// Vérification des données
if (!$data || !isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "ID manquant"]);
    exit;
}

$id = intval($data['id']);
$id_utilisateur = isset($data['id_utilisateur']) ? intval($data['id_utilisateur']) : null;

// Vérifier d'abord si l'enregistrement existe
$checkStmt = $conn->prepare("SELECT id, id_utilisateur FROM ajout_infos WHERE id = ?");
$checkStmt->bind_param("i", $id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Formulaire introuvable"]);
    $checkStmt->close();
    $conn->close();
    exit;
}

$record = $checkResult->fetch_assoc();
$checkStmt->close();

// Vérification des permissions (optionnel - pour plus de sécurité)
// Si l'utilisateur n'est pas admin, il ne peut supprimer que ses propres formulaires
if ($id_utilisateur && $record['id_utilisateur'] && $record['id_utilisateur'] != $id_utilisateur) {
    // Vérifier si l'utilisateur est admin
    $userCheck = $conn->prepare("SELECT role FROM utilisateur WHERE id_utilisateur = ?");
    $userCheck->bind_param("i", $id_utilisateur);
    $userCheck->execute();
    $userResult = $userCheck->get_result();
    
    if ($userResult->num_rows > 0) {
        $user = $userResult->fetch_assoc();
        if ($user['role'] !== 'admin') {
            echo json_encode(["success" => false, "message" => "Vous n'avez pas la permission de supprimer ce formulaire"]);
            $userCheck->close();
            $conn->close();
            exit;
        }
    }
    $userCheck->close();
}

// Préparer la requête de suppression
$stmt = $conn->prepare("DELETE FROM ajout_infos WHERE id = ?");
$stmt->bind_param("i", $id);

// Exécution
if ($stmt->execute()) {
    // Vérifier si la suppression a bien fonctionné
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true, 
            "message" => "Formulaire supprimé avec succès",
            "deletedId" => $id
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Aucun formulaire supprimé (ID peut-être invalide)"
        ]);
    }
} else {
    echo json_encode([
        "success" => false, 
        "message" => "Erreur lors de la suppression : " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>