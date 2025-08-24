<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "reseau");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM operateur");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO operateur (id_operateur, nom_operateur) VALUES (?, ?)");
            $stmt->execute([$data['id_operateur'], $data['nom_operateur']]);
            echo json_encode(['success' => true]);
            break;
            
        case 'PUT':
            $id = $_GET['id'];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE operateur SET nom_operateur = ? WHERE id_operateur = ?");
            $stmt->execute([$data['nom_operateur'], $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            $stmt = $pdo->prepare("DELETE FROM operateur WHERE id_operateur = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}