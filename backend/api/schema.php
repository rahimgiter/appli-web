<?php
// schema.php?table=xxx
header("Access-Control-Allow-Origin: *");
require 'db.php';

$table = $_GET['table'] ?? '';
if (!$table) { http_response_code(400); echo json_encode(['error'=>'table missing']); exit; }

// validate table exists in DB
$all = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array($table, $all)) { http_response_code(400); echo json_encode(['error'=>'table not allowed']); exit; }

try {
  $stmt = $pdo->prepare("DESCRIBE `$table`");
  $stmt->execute();
  $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // parse enum values if present
  foreach ($cols as &$c) {
    if (preg_match("/^enum\((.*)\)$/i", $c['Type'], $m)) {
      // split values like 'a','b'
      preg_match_all("/'([^']*)'/", $m[1], $vals);
      $c['enum_values'] = $vals[1];
    } else {
      $c['enum_values'] = null;
    }
    $c['is_primary'] = ($c['Key'] === 'PRI');
  }

  echo json_encode(['columns' => $cols]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
