<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "reseau");

$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
$expand = isset($_GET['_expand']) ? $_GET['_expand'] : null;

try {
    $pdo = new PDO("mysql:host=localhost;dbname=reseau", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            $sql = "SELECT p.*";
            if ($expand === 'region') {
                $sql .= ", r.nom_region as region_nom";
            }
            $sql .= " FROM province p";
            if ($expand === 'region') {
                $sql .= " LEFT JOIN region r ON p.id_region = r.id_region";
            }
            $stmt = $pdo->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatage pour _expand
            if ($expand === 'region') {
                $results = array_map(function($item) {
                    return [
                        ...$item,
                        'region' => $item['region_nom'] ? [
                            'id_region' => $item['id_region'],
                            'nom_region' => $item['region_nom']
                        ] : null
                    ];
                }, $results);
            }
            
            echo json_encode($results);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO province (id_province, nom_province, id_region) VALUES (?, ?, ?)");
            $stmt->execute([$data['id_province'], $data['nom_province'], $data['id_region']]);
            echo json_encode(['success' => true]);
            break;
            
        case 'PUT':
            $id = $request[0];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE province SET nom_province = ?, id_region = ? WHERE id_province = ?");
            $stmt->execute([$data['nom_province'], $data['id_region'], $id]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $request[0];
            $stmt = $pdo->prepare("DELETE FROM province WHERE id_province = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}