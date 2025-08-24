<?php
header("Content-Type: application/json");

// Gestion CORS (à ajuster selon besoins)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Gestion de la requête OPTIONS (prévol CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Connexion PDO
try {
    $pdo = new PDO("mysql:host=localhost;dbname=reseau;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
    exit();
}

// Méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Récupérer la partie après le script dans l'URL pour l'ID (ex: /api/localite.php/5)
$request = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$id = $request[0] ?? null;

// Paramètre _expand
$expand = $_GET['_expand'] ?? null;

try {
    switch ($method) {
        case 'GET':
            $sql = "SELECT l.id_localite, l.nom_localite, l.latitude, l.longitude, l.id_departement";
            if ($expand === 'departement') {
                $sql .= ", d.nom_departement as departement_nom";
            }
            $sql .= " FROM localite l";
            if ($expand === 'departement') {
                $sql .= " LEFT JOIN departement d ON l.id_departement = d.id_departement";
            }

            if ($id) {
                $sql .= " WHERE l.id_localite = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $id]);
                $results = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$results) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Localité non trouvée']);
                    exit();
                }
                $results = [$results]; // Pour garder la même structure que fetchAll
            } else {
                $stmt = $pdo->query($sql);
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($expand === 'departement') {
                $results = array_map(function($item) {
                    return array_merge($item, [
                        'departement' => isset($item['departement_nom']) ? [
                            'id_departement' => $item['id_departement'],
                            'nom_departement' => $item['departement_nom']
                        ] : null
                    ]);
                }, $results);
            }

            // Si une seule ressource demandée, retourner l'objet directement
            if ($id) {
                echo json_encode($results[0]);
            } else {
                echo json_encode($results);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['nom_localite'], $data['latitude'], $data['longitude'], $data['id_departement'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Données invalides ou incomplètes']);
                exit();
            }
            $stmt = $pdo->prepare("INSERT INTO localite (nom_localite, latitude, longitude, id_departement) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['nom_localite'],
                $data['latitude'],
                $data['longitude'],
                $data['id_departement']
            ]);
            echo json_encode(['id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID manquant pour la mise à jour']);
                exit();
            }
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['nom_localite'], $data['latitude'], $data['longitude'], $data['id_departement'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Données invalides ou incomplètes']);
                exit();
            }
            $stmt = $pdo->prepare("UPDATE localite SET nom_localite = ?, latitude = ?, longitude = ?, id_departement = ? WHERE id_localite = ?");
            $stmt->execute([
                $data['nom_localite'],
                $data['latitude'],
                $data['longitude'],
                $data['id_departement'],
                $id
            ]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID manquant pour la suppression']);
                exit();
            }
            $stmt = $pdo->prepare("DELETE FROM localite WHERE id_localite = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => "Méthode HTTP '$method' non supportée"]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
