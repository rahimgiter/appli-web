<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "reseau");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM departement");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO departement (id_departement, nom_departement, id_province) VALUES (?, ?, ?)");
            $stmt->execute([$data['id_departement'], $data['nom_departement'], $data['id_province']]);
            echo json_encode(['success' => true]);
            break;
            
        case 'PUT':
            $id = $_GET['id'];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE departement SET nom_departement = ?, id_province = ? WHERE id_departement = ?");
            $stmt->execute([$data['nom_departement'], $data['id_province'], $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'];
            $stmt = $pdo->prepare("DELETE FROM departement WHERE id_departement = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}