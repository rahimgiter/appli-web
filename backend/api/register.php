<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration de la base de données
$host = 'localhost';
$dbname = 'reseau';
$username = 'root';
$password = '';

function sendResponse($success, $message, $statusCode = 200, $additionalData = []) {
    http_response_code($statusCode);
    $response = array_merge(['success' => $success, 'message' => $message], $additionalData);
    echo json_encode($response);
    exit();
}

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("Erreur connexion DB: " . $e->getMessage());
    sendResponse(false, 'Erreur de connexion à la base de données', 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $input = json_decode($json, true);
    
    // Récupération des données
    $nom_famille = isset($input['nom_famille']) ? trim($input['nom_famille']) : '';
    $prenom = isset($input['prenom']) ? trim($input['prenom']) : '';
    $fonction = isset($input['fonction']) ? trim($input['fonction']) : 'Utilisateur';
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    $mot_de_passe = $input['mot_de_passe'] ?? '';
    $role = $input['role'] ?? 'observateur'; // ⬅️ Rôle observateur par défaut
    
    // Validation
    if (empty($nom_famille) || empty($prenom) || empty($email) || empty($mot_de_passe)) {
        sendResponse(false, 'Tous les champs obligatoires doivent être remplis', 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, 'Format d\'email invalide', 400);
    }
    
    if (strlen($mot_de_passe) < 6) {
        sendResponse(false, 'Le mot de passe doit contenir au moins 6 caractères', 400);
    }
    
    try {
        // Vérifier si l'email existe déjà
        $stmt = $db->prepare("SELECT id_utilisateur FROM utilisateur WHERE email = ?");
        $stmt->execute([$email]);
        $existingUser = $stmt->fetch();
        
        if ($existingUser) {
            sendResponse(false, 'Cet email est déjà utilisé', 400);
        }
        
        // Hasher le mot de passe
        $hashedPassword = password_hash($mot_de_passe, PASSWORD_DEFAULT);
        
        // Insérer le nouvel utilisateur
        $stmt = $db->prepare("
            INSERT INTO utilisateur 
            (nom_famille, prenom, fonction, email, mot_de_passe, role, date_creation, actif) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
        ");
        
        $stmt->execute([
            $nom_famille,
            $prenom,
            $fonction,
            $email,
            $hashedPassword,
            $role
        ]);
        
        $userId = $db->lastInsertId();
        
        // Récupérer l'utilisateur créé
        $stmt = $db->prepare("
            SELECT id_utilisateur, nom_famille, prenom, fonction, email, role, date_creation 
            FROM utilisateur 
            WHERE id_utilisateur = ?
        ");
        $stmt->execute([$userId]);
        $newUser = $stmt->fetch();
        
        error_log("✅ Nouvel utilisateur créé: $prenom $nom_famille ($email) - Rôle: $role");
        
        sendResponse(true, 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 201, [
            'utilisateur' => $newUser
        ]);
        
    } catch (Exception $e) {
        error_log("Erreur register: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la création du compte', 500);
    }
} else {
    sendResponse(false, 'Méthode non autorisée', 405);
}
?>