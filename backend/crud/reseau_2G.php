<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO reseau_2G (nom_2G, qualite_2G, commentaire_2G) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_2G'], $_POST['qualite_2G'], $_POST['commentaire_2G']]);
    echo json_encode(["message" => "reseau_2G ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM reseau_2G")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE reseau_2G SET nom_2G=?, qualite_2G=?, commentaire_2G=? WHERE id_reseau_2G=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_2G'], $_POST['qualite_2G'], $_POST['commentaire_2G'], $id]);
    echo json_encode(["message" => "reseau_2G modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM reseau_2G WHERE id_reseau_2G=?")->execute([$id]);
    echo json_encode(["message" => "reseau_2G supprimé avec succès."]);
}

?>