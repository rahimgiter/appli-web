<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO reseau_4G (nom_4G, qualite_4G, commentaire_4G) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_4G'], $_POST['qualite_4G'], $_POST['commentaire_4G']]);
    echo json_encode(["message" => "reseau_4G ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM reseau_4G")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE reseau_4G SET nom_4G=?, qualite_4G=?, commentaire_4G=? WHERE id_reseau_4G=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_4G'], $_POST['qualite_4G'], $_POST['commentaire_4G'], $id]);
    echo json_encode(["message" => "reseau_4G modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM reseau_4G WHERE id_reseau_4G=?")->execute([$id]);
    echo json_encode(["message" => "reseau_4G supprimé avec succès."]);
}

?>