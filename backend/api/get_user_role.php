<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration de la base de données
$host = 'localhost';
$dbname = 'reseau';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer l'ID utilisateur depuis les paramètres GET
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID utilisateur manquant'
        ]);
        exit();
    }

    // Récupérer le rôle depuis la base de données
    $sql = "SELECT id_utilisateur, role, prenom, nom_famille, email 
            FROM utilisateur 
            WHERE id_utilisateur = ? AND actif = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            'success' => true,
            'role' => $user['role'],
            'user_id' => $user['id_utilisateur'],
            'user_info' => [
                'prenom' => $user['prenom'],
                'nom_famille' => $user['nom_famille'],
                'email' => $user['email']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur non trouvé ou désactivé'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
}
?>