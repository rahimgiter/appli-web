<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO village (nom_village, longitude, latitude, hommes, femmes, pop_total, id_commune) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_village'], $_POST['longitude'], $_POST['latitude'], $_POST['hommes'], $_POST['femmes'], $_POST['pop_total'], $_POST['id_commune']]);
    echo json_encode(["message" => "village ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM village")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE village SET nom_village=?, longitude=?, latitude=?, hommes=?, femmes=?, pop_total=?, id_commune=? WHERE id_village=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_village'], $_POST['longitude'], $_POST['latitude'], $_POST['hommes'], $_POST['femmes'], $_POST['pop_total'], $_POST['id_commune'], $id]);
    echo json_encode(["message" => "village modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM village WHERE id_village=?")->execute([$id]);
    echo json_encode(["message" => "village supprimé avec succès."]);
}

?>