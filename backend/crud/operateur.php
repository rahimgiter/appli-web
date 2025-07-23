<?php
$conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO operateur (nom_operateur) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_operateur']]);
    echo json_encode(["message" => "operateur ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM operateur")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE operateur SET nom_operateur=? WHERE id_operateur=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_operateur'], $id]);
    echo json_encode(["message" => "operateur modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM operateur WHERE id_operateur=?")->execute([$id]);
    echo json_encode(["message" => "operateur supprimé avec succès."]);
}

?>