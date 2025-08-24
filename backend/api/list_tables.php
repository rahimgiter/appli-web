<?php
// list_tables.php
header("Access-Control-Allow-Origin: *");
require 'db.php';
try {
  $stmt = $pdo->query("SHOW TABLES");
  $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
  echo json_encode(['tables' => $tables]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
