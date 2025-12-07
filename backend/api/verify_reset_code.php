<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration de la base de données - À MODIFIER !
$host = 'localhost';
$dbname = 'reseau';
$username = 'root';
$password = '';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("Erreur connexion DB: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    $code = isset($input['code']) ? trim($input['code']) : '';
    
    // Validation
    if (empty($email) || empty($code)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email et code requis']);
        exit;
    }
    
    if (strlen($code) !== 6 || !is_numeric($code)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Le code doit contenir 6 chiffres']);
        exit;
    }
    
    try {
        // Vérifier le code dans password_resets et lier avec utilisateur
        $stmt = $db->prepare("
            SELECT pr.*, u.id_utilisateur 
            FROM password_resets pr 
            LEFT JOIN utilisateur u ON pr.email = u.email 
            WHERE pr.email = ? AND pr.code = ? AND pr.expires_at > NOW() AND pr.used = 0
            ORDER BY pr.created_at DESC LIMIT 1
        ");
        
        $stmt->execute([$email, $code]);
        $resetRequest = $stmt->fetch();
        
        if (!$resetRequest) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Code invalide, expiré ou déjà utilisé'
            ]);
            exit;
        }
        
        // Vérifier que l'utilisateur existe toujours
        if (!$resetRequest['id_utilisateur']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
            exit;
        }
        
        // Log de vérification réussie
        error_log("Code vérifié avec succès pour l'utilisateur ID: " . $resetRequest['id_utilisateur']);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Code validé avec succès',
            'user_id' => $resetRequest['id_utilisateur']
        ]);
        
    } catch (Exception $e) {
        error_log("Erreur verify_reset_code: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la vérification']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>