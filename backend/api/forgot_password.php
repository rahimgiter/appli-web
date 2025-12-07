<?php
// Headers CORS COMPLETS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';
require_once '../vendor/autoload.php'; // ⬅️ AJOUTER PHPMailer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Activer l'affichage des erreurs pour le débogage
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
        
        // Contenu
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = isset($input['email']) ? trim($input['email']) : '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'L\'email est requis']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format d\'email invalide']);
        exit;
    }
    
    try {
        $db = Config::getDB();
        
        // ⚠️ CORRECTION : Utiliser votre table "utilisateur" au lieu de "users"
        $stmt = $db->prepare("SELECT id_utilisateur, email, prenom, nom_famille FROM utilisateur WHERE email = ? AND actif = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        // Pour la sécurité, on envoie toujours la même réponse même si l'email n'existe pas
        if (!$user) {
            error_log("Tentative de réinitialisation pour email inexistant: $email");
            echo json_encode([
                'success' => true, 
                'message' => 'Si cet email existe dans notre système, vous recevrez un code de réinitialisation.'
            ]);
            exit;
        }
        
        // Générer un code à 6 chiffres
        $code = sprintf("%06d", random_int(0, 999999));
        $expires_at = date('Y-m-d H:i:s', time() + 3600); // Expire dans 1 heure
        
        // ⚠️ CORRECTION : Table avec VARCHAR(191) pour compatibilité
        $stmt = $db->prepare("
            CREATE TABLE IF NOT EXISTS password_resets (
                id_reset INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(191) NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used TINYINT DEFAULT 0,
                UNIQUE KEY unique_email (email)
            )
        ");
        $stmt->execute();
        
        // Insérer ou mettre à jour le code
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
        
        // 🔥 ENVOI RÉEL D'EMAIL AVEC PHPMailer
        $userName = $user['prenom'] . ' ' . $user['nom_famille'];
        $emailSent = sendResetEmail($email, $userName, $code);
        
        if ($emailSent) {
            error_log("✅ Email envoyé avec succès à: $email");
            echo json_encode([
                'success' => true, 
                'message' => 'Un code de réinitialisation a été envoyé à votre adresse email.'
            ]);
        } else {
            throw new Exception('Erreur lors de l\'envoi de l\'email');
        }
        
    } catch (Exception $e) {
        error_log("Erreur lors de la réinitialisation: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Erreur serveur lors du traitement de votre demande'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>