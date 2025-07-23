<?php
$conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO commune (nom_commune, id_province) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_commune'], $_POST['id_province']]);
    echo json_encode(["message" => "commune ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM commune")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE commune SET nom_commune=?, id_province=? WHERE id_commune=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_commune'], $_POST['id_province'], $id]);
    echo json_encode(["message" => "commune modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM commune WHERE id_commune=?")->execute([$id]);
    echo json_encode(["message" => "commune supprimé avec succès."]);
}

?>