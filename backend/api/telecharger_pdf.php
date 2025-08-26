<?php
require('fpdf/fpdf.php'); // Assure-toi d'avoir FPDF dans le dossier


$conn = new mysqli("localhost", "root", "", "reseau");
if ($conn->connect_error) {
  die("Erreur de connexion à la base de données");
}

// Récupérer tous les sites avec opérateur et technologies
$sql = "SELECT s.nom_site, o.nom_operateur, s.qualite_2g, s.qualite_3g, s.qualite_4g FROM site s INNER JOIN operateur o ON s.operateur = o.id_operateur ORDER BY o.nom_operateur, s.nom_site";
$result = $conn->query($sql);

$sites = [];
while ($row = $result->fetch_assoc()) {
  // Pour chaque techno, si elle existe, on ajoute le site dans la bonne catégorie
  $operateur = $row['nom_operateur'];
  if (!isset($sites[$operateur])) $sites[$operateur] = [];
  if (!empty($row['qualite_2g'])) {
    $sites[$operateur]['2G'][] = $row['nom_site'];
  }
  if (!empty($row['qualite_3g'])) {
    $sites[$operateur]['3G'][] = $row['nom_site'];
  }
  if (!empty($row['qualite_4g'])) {
    $sites[$operateur]['4G'][] = $row['nom_site'];
  }
}

$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetFont('Arial','B',16);
$pdf->Cell(0,12,"Liste des sites par opérateur et technologie",0,1,"C");
$pdf->SetFont('Arial','',12);

foreach ($sites as $operateur => $technos) {
  $pdf->SetFont('Arial','B',14);
  $pdf->Cell(0,10,"Opérateur : " . $operateur,0,1);
  foreach ($technos as $techno => $listeSites) {
    $pdf->SetFont('Arial','B',12);
    $pdf->Cell(0,8,"Technologie : " . $techno,0,1);
    $pdf->SetFont('Arial','',11);
    foreach ($listeSites as $site) {
      $pdf->Cell(0,7,"- " . $site,0,1);
    }
    $pdf->Ln(2);
  }
  $pdf->Ln(4);
}

$pdf->Output();
