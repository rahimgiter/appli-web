<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS pour CORS
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
    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer les données JSON du corps de la requête
    $input = json_decode(file_get_contents('php://input'), true);

    // Valider les données requises
    if (!isset($input['nom_famille']) || !isset($input['prenom']) || 
        !isset($input['fonction']) || !isset($input['email']) || 
        !isset($input['mot_de_passe']) || !isset($input['role'])) {
        
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tous les champs obligatoires doivent être remplis'
        ]);
        exit();
    }

    // Nettoyer et valider les données
    $nom_famille = trim($input['nom_famille']);
    $prenom = trim($input['prenom']);
    $fonction = trim($input['fonction']);
    $email = trim($input['email']);
    $mot_de_passe = $input['mot_de_passe'];
    $role = $input['role'];

    // Validation de l'email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format d\'email invalide'
        ]);
        exit();
    }

    // Vérifier la longueur du mot de passe
    if (strlen($mot_de_passe) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Le mot de passe doit contenir au moins 6 caractères'
        ]);
        exit();
    }

    // Vérifier si l'email existe déjà
    $checkEmailSql = "SELECT id_utilisateur FROM utilisateur WHERE email = ?";
    $checkStmt = $pdo->prepare($checkEmailSql);
    $checkStmt->execute([$email]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Un utilisateur avec cet email existe déjà'
        ]);
        exit();
    }

    // Hasher le mot de passe
    $mot_de_passe_hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);

    // Préparer la requête d'insertion
    $sql = "INSERT INTO utilisateur 
            (nom_famille, prenom, fonction, email, mot_de_passe, role, date_creation, actif) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)";

    $stmt = $pdo->prepare($sql);
    
    // Exécuter l'insertion
    $success = $stmt->execute([
        $nom_famille,
        $prenom,
        $fonction,
        $email,
        $mot_de_passe_hash,
        $role
    ]);

    if ($success) {
        // Récupérer l'ID du nouvel utilisateur
        $id_utilisateur = $pdo->lastInsertId();
        
        // Générer l'identifiant unique
        $identifiant = strtoupper(substr($prenom, 0, 1) . substr($nom_famille, 0, 3) . $id_utilisateur);
        
        // Mettre à jour l'identifiant
        $updateSql = "UPDATE utilisateur SET identifiant = ? WHERE id_utilisateur = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$identifiant, $id_utilisateur]);

        echo json_encode([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'identifiant' => $identifiant,
            'id_utilisateur' => $id_utilisateur
        ]);
    } else {
        throw new Exception('Erreur lors de l\'insertion dans la base de données');
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>