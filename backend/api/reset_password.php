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
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    $code = isset($input['code']) ? trim($input['code']) : '';
    $nouveau_mot_de_passe = isset($input['nouveau_mot_de_passe']) ? $input['nouveau_mot_de_passe'] : '';
    
    // Validation complète
    if (empty($user_id) || empty($email) || empty($code) || empty($nouveau_mot_de_passe)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Toutes les données sont requises']);
        exit;
    }
    
    if (strlen($nouveau_mot_de_passe) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Le mot de passe doit contenir au moins 6 caractères'
        ]);
        exit;
    }
    
    try {
        // Vérifier une dernière fois le code
        $stmt = $db->prepare("
            SELECT * FROM password_resets 
            WHERE email = ? AND code = ? AND expires_at > NOW() AND used = 0
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
        
        // Vérifier que l'user_id correspond à l'email dans la table utilisateur
        $stmt = $db->prepare("SELECT id_utilisateur, email FROM utilisateur WHERE id_utilisateur = ? AND email = ?");
        $stmt->execute([$user_id, $email]);
        $utilisateur = $stmt->fetch();
        
        if (!$utilisateur) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Incohérence dans les données utilisateur'
            ]);
            exit;
        }
        
        // Hasher le nouveau mot de passe
        $hashedPassword = password_hash($nouveau_mot_de_passe, PASSWORD_DEFAULT);
        
        // Mettre à jour le mot de passe dans la table utilisateur
        $stmt = $db->prepare("UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?");
        $stmt->execute([$hashedPassword, $user_id]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Échec de la mise à jour du mot de passe');
        }
        
        // Marquer le code comme utilisé
        $stmt = $db->prepare("UPDATE password_resets SET used = 1 WHERE email = ? AND code = ?");
        $stmt->execute([$email, $code]);
        
        // Logger la réinitialisation réussie
        error_log("✅ Mot de passe réinitialisé avec succès pour l'utilisateur ID: $user_id, Email: $email");
        
        echo json_encode([
            'success' => true, 
            'message' => 'Mot de passe réinitialisé avec succès'
        ]);
        
    } catch (Exception $e) {
        error_log("❌ Erreur reset_password: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Erreur lors de la réinitialisation du mot de passe'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>