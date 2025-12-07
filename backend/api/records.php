<?php
// records.php - Gestion complète CRUD pour une table
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$table = $_GET['table'] ?? '';

// Validation de la table
if (!$table) {
    http_response_code(400);
    echo json_encode(['error' => 'table missing']);
    exit;
}

// Vérifier que la table existe
$allTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array($table, $allTables)) {
    http_response_code(400);
    echo json_encode(['error' => 'table not allowed']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            handleGet($pdo, $table);
            break;
        case 'POST':
            handlePost($pdo, $table);
            break;
        case 'PUT':
            handlePut($pdo, $table);
            break;
        case 'DELETE':
            handleDelete($pdo, $table);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Récupération des données avec pagination
function handleGet($pdo, $table) {
    $page = max(1, intval($_GET['page'] ?? 1));
    $pageSize = min(100, max(1, intval($_GET['pageSize'] ?? 50)));
    $offset = ($page - 1) * $pageSize;

    // Compter le total
    $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
    $total = $countStmt->fetchColumn();

    // Récupérer les données
    $stmt = $pdo->prepare("SELECT * FROM `$table` LIMIT ? OFFSET ?");
    $stmt->execute([$pageSize, $offset]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'rows' => $rows,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize
    ]);
}

// Création d'un nouvel enregistrement
function handlePost($pdo, $table) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    $columns = [];
    $placeholders = [];
    $values = [];

    foreach ($input as $key => $value) {
        $columns[] = "`$key`";
        $placeholders[] = "?";
        $values[] = $value;
    }

    $columnsStr = implode(', ', $columns);
    $placeholdersStr = implode(', ', $placeholders);

    $sql = "INSERT INTO `$table` ($columnsStr) VALUES ($placeholdersStr)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $lastId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'id' => $lastId,
        'message' => 'Record created successfully'
    ]);
}

// Modification d'un enregistrement
function handlePut($pdo, $table) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    // Récupérer la clé primaire
    $stmt = $pdo->prepare("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
    $stmt->execute();
    $primaryKeyInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$primaryKeyInfo) {
        http_response_code(400);
        echo json_encode(['error' => 'No primary key found']);
        return;
    }

    $pkColumn = $primaryKeyInfo['Column_name'];
    
    if (!isset($input[$pkColumn])) {
        http_response_code(400);
        echo json_encode(['error' => 'Primary key value missing']);
        return;
    }

    $pkValue = $input[$pkColumn];
    unset($input[$pkColumn]);

    $updates = [];
    $values = [];

    foreach ($input as $key => $value) {
        $updates[] = "`$key` = ?";
        $values[] = $value;
    }

    $values[] = $pkValue; // Pour la clause WHERE

    $updatesStr = implode(', ', $updates);
    $sql = "UPDATE `$table` SET $updatesStr WHERE `$pkColumn` = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    echo json_encode([
        'success' => true,
        'message' => 'Record updated successfully',
        'affected_rows' => $stmt->rowCount()
    ]);
}

// Suppression d'un enregistrement
function handleDelete($pdo, $table) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        return;
    }

    // Récupérer la clé primaire
    $stmt = $pdo->prepare("SHOW KEYS FROM `$table` WHERE Key_name = 'PRIMARY'");
    $stmt->execute();
    $primaryKeyInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$primaryKeyInfo) {
        http_response_code(400);
        echo json_encode(['error' => 'No primary key found']);
        return;
    }

    $pkColumn = $primaryKeyInfo['Column_name'];
    
    if (!isset($input[$pkColumn])) {
        http_response_code(400);
        echo json_encode(['error' => 'Primary key value missing']);
        return;
    }

    $pkValue = $input[$pkColumn];
    $sql = "DELETE FROM `$table` WHERE `$pkColumn` = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$pkValue]);

    echo json_encode([
        'success' => true,
        'message' => 'Record deleted successfully',
        'affected_rows' => $stmt->rowCount()
    ]);
}