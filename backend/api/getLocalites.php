<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "reseau");

$sql = "SELECT id_localite, nom_localite FROM localite";
$result = $conn->query($sql);

$localites = [];

while ($row = $result->fetch_assoc()) {
    $localites[] = $row;
}

echo json_encode($localites);
?>

