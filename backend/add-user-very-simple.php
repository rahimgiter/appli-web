<?php
// add-user-very-simple.php
header("Content-Type: application/json");

// Connexion à la base
$conn = new mysqli("localhost", "root", "", "reseau");

// Données utilisateur (à modifier)
$nom_famille = "SIMPORE";
$prenom = "ABDOUL RAHIM";
$fonction = "Administrateur";
$email = "rahimgenious64@gmail.com";
$mot_de_passe = "couverture360admin";
$role = "admin";

// Hacher le mot de passe
$mot_de_passe_hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);

// Insérer dans la base
$sql = "INSERT INTO utilisateur (nom_famille, prenom, fonction, email, mot_de_passe, role) 
        VALUES ('$nom_famille', '$prenom', '$fonction', '$email', '$mot_de_passe_hash', '$role')";

if ($conn->query($sql) === TRUE) {
    echo "Utilisateur ajouté avec succès!";
} else {
    echo "Erreur: " . $conn->error;
}

$conn->close();
?>