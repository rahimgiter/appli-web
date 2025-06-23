<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO province (nom_province, id_region) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_province'], $_POST['id_region']]);
    echo json_encode(["message" => "province ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM province")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE province SET nom_province=?, id_region=? WHERE id_province=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_province'], $_POST['id_region'], $id]);
    echo json_encode(["message" => "province modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM province WHERE id_province=?")->execute([$id]);
    echo json_encode(["message" => "province supprimé avec succès."]);
}

?>