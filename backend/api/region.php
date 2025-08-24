<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "reseau");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM region");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO region (id_region, nom_region) VALUES (?, ?)");
            $stmt->execute([$data['id_region'], $data['nom_region']]);
            echo json_encode(['success' => true]);
            break;
            
        case 'PUT':
            $id = $_GET['id'];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE region SET nom_region = ? WHERE id_region = ?");
            $stmt->execute([$data['nom_region'], $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            $stmt = $pdo->prepare("DELETE FROM region WHERE id_region = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}