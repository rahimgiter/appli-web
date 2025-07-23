<?php
require('fpdf/fpdf.php'); // Assure-toi d'avoir FPDF dans le dossier

$id = $_GET['id'] ?? null;
$conn = new mysqli("localhost", "root", "", "reseau");

if (!$id) {
  die("ID manquant");
}

$res = $conn->query("SELECT * FROM ajout_infos WHERE id = $id");
$data = $res->fetch_assoc();

$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetFont('Arial','B',14);
$pdf->Cell(0,10,"Formulaire Village",0,1,"C");
$pdf->SetFont('Arial','',12);

foreach ($data as $key => $value) {
  $pdf->Cell(50,10,ucfirst(str_replace("_", " ", $key)) . ":",0,0);
  $pdf->Cell(100,10,$value,0,1);
}

$pdf->Output();
