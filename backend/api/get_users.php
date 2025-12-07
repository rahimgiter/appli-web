<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'reseau';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // REQUÊTE CORRIGÉE - sans identifiant
    $sql = "SELECT 
                id_utilisateur,
                nom_famille,
                prenom,
                fonction,
                email,
                role,
                date_creation,
                actif
            FROM utilisateur 
            ORDER BY nom_famille, prenom";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $utilisateurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formater les données
    foreach ($utilisateurs as &$utilisateur) {
        $utilisateur['actif'] = (bool)$utilisateur['actif'];
        
        if ($utilisateur['date_creation']) {
            $date = new DateTime($utilisateur['date_creation']);
            $utilisateur['date_creation_formatted'] = $date->format('d/m/Y H:i');
        }
    }

    echo json_encode([
        'success' => true,
        'utilisateurs' => $utilisateurs,
        'total' => count($utilisateurs)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
}
?>