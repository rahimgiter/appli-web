<?php
// Autorise les requêtes depuis n'importe quelle origine
header("Access-Control-Allow-Origin: *");

// Autorise les méthodes HTTP spécifiques
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Autorise les en-têtes personnalisés
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Autorise les cookies si nécessaire
header("Access-Control-Allow-Credentials: true");

// Cache les options preflight pendant 1 jour
header("Access-Control-Max-Age: 86400");

// Répond immédiatement aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
?>