<?php
$conn = new PDO("mysql:host=localhost;dbname=couverture_reseau", "root", "");

// ===== AJOUTER =====
if (isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $sql = "INSERT INTO reseau_3G (nom_3G, qualite_3G, commentaire_3G) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_3G'], $_POST['qualite_3G'], $_POST['commentaire_3G']]);
    echo json_encode(["message" => "reseau_3G ajouté avec succès."]);
}

// ===== LISTER =====
elseif (isset($_GET['action']) && $_GET['action'] === 'lister') {
    $data = $conn->query("SELECT * FROM reseau_3G")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data);
}

// ===== MODIFIER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'modifier') {
    $id = $_POST['id'];
    $sql = "UPDATE reseau_3G SET nom_3G=?, qualite_3G=?, commentaire_3G=? WHERE id_reseau_3G=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$_POST['nom_3G'], $_POST['qualite_3G'], $_POST['commentaire_3G'], $id]);
    echo json_encode(["message" => "reseau_3G modifié avec succès."]);
}

// ===== SUPPRIMER =====
elseif (isset($_POST['action']) && $_POST['action'] === 'supprimer') {
    $id = $_POST['id'];
    $conn->prepare("DELETE FROM reseau_3G WHERE id_reseau_3G=?")->execute([$id]);
    echo json_encode(["message" => "reseau_3G supprimé avec succès."]);
}

?>