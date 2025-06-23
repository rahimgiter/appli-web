<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO region (nom_region) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_region']]);
    echo json_encode(["message" => "region ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM region")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE region SET nom_region=? WHERE id_region=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_region'], $id]);
    echo json_encode(["message" => "region modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM region WHERE id_region=?")->execute([$id]);
    echo json_encode(["message" => "region supprimé avec succès."]);
}

?>