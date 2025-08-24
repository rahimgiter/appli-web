<?php
// records.php?table=xxx&page=1&pageSize=50
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$table = $_GET['table'] ?? ($_POST['table'] ?? null);
if (!$table) { http_response_code(400); echo json_encode(['error'=>'table missing']); exit; }

// validate table
$all = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array($table, $all)) { http_response_code(400); echo json_encode(['error'=>'table not allowed']); exit; }

// get schema once
$cols = $pdo->prepare("DESCRIBE `$table`");
$cols->execute();
$columns = $cols->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($columns, 'Field');
$pkCols = array_values(array_filter($columns, fn($c)=>$c['Key']==='PRI'));
$pkName = $pkCols[0]['Field'] ?? null;

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {
  if ($method === 'OPTIONS') { http_response_code(200); exit; }

  if ($method === 'GET') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $pageSize = min(200, max(1, (int)($_GET['pageSize'] ?? 50)));
    $offset = ($page-1)*$pageSize;

    $total = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    $stmt = $pdo->prepare("SELECT * FROM `$table` LIMIT :offset, :limit");
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['total' => (int)$total, 'rows' => $rows]);
    exit;
  }

  if ($method === 'POST') {
    // create
    $pairs = [];
    $placeholders = [];
    $params = [];
    foreach ($colNames as $c) {
      // skip auto_increment if present
      $meta = array_values(array_filter($columns, fn($m) => $m['Field']===$c))[0];
      if (strpos($meta['Extra'], 'auto_increment') !== false) continue;
      if (array_key_exists($c, $input)) {
        $pairs[] = "`$c`";
        $placeholders[] = ":$c";
        $params[":$c"] = $input[$c];
      }
    }
    $sql = "INSERT INTO `$table` (".implode(',', $pairs).") VALUES (".implode(',', $placeholders).")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $id = $pdo->lastInsertId();
    echo json_encode(['success'=>true, 'id'=>$id]);
    exit;
  }

  if ($method === 'PUT') {
    if (!$pkName) { http_response_code(400); echo json_encode(['error'=>'no primary key']); exit; }
    if (!isset($input[$pkName])) { http_response_code(400); echo json_encode(['error'=>'primary key value missing']); exit; }

    $sets = [];
    $params = [];
    foreach ($colNames as $c) {
      if ($c === $pkName) continue;
      if (array_key_exists($c, $input)) {
        $sets[] = "`$c` = :$c";
        $params[":$c"] = $input[$c];
      }
    }
    if (empty($sets)) { echo json_encode(['success'=>false,'message'=>'no fields to update']); exit; }
    $params[":pk"] = $input[$pkName];
    $sql = "UPDATE `$table` SET ".implode(',', $sets)." WHERE `$pkName` = :pk";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success'=>true,'affected'=>$stmt->rowCount()]);
    exit;
  }

  if ($method === 'DELETE') {
    if (!$pkName) { http_response_code(400); echo json_encode(['error'=>'no primary key']); exit; }

    // support pk via query or body
    $pkVal = $_GET[$pkName] ?? $input[$pkName] ?? null;
    if ($pkVal === null) { http_response_code(400); echo json_encode(['error'=>'primary key value missing']); exit; }

    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE `$pkName` = :pk");
    $stmt->execute([':pk' => $pkVal]);
    echo json_encode(['success'=>true,'deleted'=>$stmt->rowCount()]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['error'=>'method not allowed']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>$e->getMessage()]);
}
