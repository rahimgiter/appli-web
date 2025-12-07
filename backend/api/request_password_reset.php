<?php
// Headers CORS COMPLETS - Doivent être les premières lignes
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Gestion SPECIFIQUE de la requête OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // Retourner directement une réponse 200 pour les préflight
    http_response_code(200);
    exit();
}

// Charger PHPMailer
require_once '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Configuration de la base de données
$host = 'localhost';
$dbname = 'reseau';
$username = 'root';
$password = '';

// Fonction pour envoyer l'email
function sendResetEmail($toEmail, $toName, $code) {
    $mail = new PHPMailer(true);
    
    try {
        // Configuration Gmail
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'rahimgenious64@gmail.com'; // ⬅️ REMPLACER
        $mail->Password = 'pmmb zjuj qqwu qvzd'; // ⬅️ REMPLACER
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        // Expéditeur
        $mail->setFrom('rahimgenious64@gmail.com', 'Couverture360'); // ⬅️ REMPLACER
        $mail->addAddress($toEmail, $toName);
        
        // Contenu de l'email
        $mail->isHTML(true);
        $mail->Subject = 'Code de réinitialisation de mot de passe';
        
        $mail->Body = "
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour <strong>$toName</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            
            <div style='background: #667eea; color: white; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 5px; margin: 20px 0;'>
                Votre code : <strong>$code</strong>
            </div>
            
            <p><strong>⚠️ Important :</strong></p>
            <ul>
                <li>Ce code est valable pendant <strong>1 heure</strong></li>
                <li>Ne partagez jamais ce code</li>
                <li>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email</li>
            </ul>
            
            <p>Cordialement,<br>L'équipe de votre application</p>
        ";
        
        $mail->AltBody = "Votre code de réinitialisation : $code\n\nCe code expire dans 1 heure.";
        
        return $mail->send();
        
    } catch (Exception $e) {
        error_log("Erreur PHPMailer: " . $mail->ErrorInfo);
        return false;
    }
}

// Fonction pour envoyer une réponse JSON
function sendResponse($success, $message, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
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
    // Vérifier le Content-Type
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    if ($contentType !== 'application/json') {
        sendResponse(false, 'Content-Type must be application/json', 400);
    }
    
    // Lire les données JSON
    $json = file_get_contents('php://input');
    $input = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Données JSON invalides', 400);
    }
    
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    
    if (empty($email)) {
        sendResponse(false, 'L\'email est requis', 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, 'Format d\'email invalide', 400);
    }
    
    try {
        $stmt = $db->prepare("SELECT id_utilisateur, email, prenom, nom_famille FROM utilisateur WHERE email = ? AND actif = 1");
        $stmt->execute([$email]);
        $utilisateur = $stmt->fetch();
        
        if (!$utilisateur) {
            error_log("Tentative de réinitialisation pour email inexistant: $email");
            // Pour la sécurité, on envoie une réponse positive même si l'email n'existe pas
            sendResponse(true, 'Si cet email existe dans notre système, vous recevrez un code de réinitialisation.');
        }
        
        $code = sprintf("%06d", random_int(0, 999999));
        $expires_at = date('Y-m-d H:i:s', time() + 3600);
        
        // Créer la table si elle n'existe pas
        $db->exec("
            CREATE TABLE IF NOT EXISTS password_resets (
                id_reset INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(191) NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used TINYINT DEFAULT 0,
                UNIQUE KEY unique_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        $stmt = $db->prepare("
            INSERT INTO password_resets (email, code, expires_at) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            code = VALUES(code), 
            expires_at = VALUES(expires_at),
            used = 0,
            created_at = CURRENT_TIMESTAMP
        ");
        
        $stmt->execute([$email, $code, $expires_at]);
        
        // 🔥 ENVOI RÉEL D'EMAIL
        $userName = $utilisateur['prenom'] . ' ' . $utilisateur['nom_famille'];
        $emailSent = sendResetEmail($email, $userName, $code);
        
        if ($emailSent) {
            error_log("✅ Email envoyé avec succès à: $email - Code: $code");
            sendResponse(true, 'Un code de réinitialisation a été envoyé à votre adresse email.');
        } else {
            throw new Exception('Erreur lors de l\'envoi de l\'email');
        }
        
    } catch (Exception $e) {
        error_log("Erreur request_password_reset: " . $e->getMessage());
        sendResponse(false, 'Erreur serveur lors du traitement de votre demande', 500);
    }
} else {
    sendResponse(false, 'Méthode non autorisée', 405);
}
?>