<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO site (nom_site, id_village, id_2G, id_3G, id_4G, antenne_disponible) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_site'], $_POST['id_village'], $_POST['id_2G'], $_POST['id_3G'], $_POST['id_4G'], $_POST['antenne_disponible']]);
    echo json_encode(["message" => "site ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM site")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE site SET nom_site=?, id_village=?, id_2G=?, id_3G=?, id_4G=?, antenne_disponible=? WHERE id_site=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_site'], $_POST['id_village'], $_POST['id_2G'], $_POST['id_3G'], $_POST['id_4G'], $_POST['antenne_disponible'], $id]);
    echo json_encode(["message" => "site modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM site WHERE id_site=?")->execute([$id]);
    echo json_encode(["message" => "site supprimé avec succès."]);
}

?>