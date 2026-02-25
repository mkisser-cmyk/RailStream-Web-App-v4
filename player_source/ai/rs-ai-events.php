<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');

$raw = file_get_contents('php://input');
if (!$raw) {
  http_response_code(204);
  exit;
}

$logDir = '/var/lib/railstream-player/ai/raw';
@mkdir($logDir, 0750, true);

$entry = [
  'ts'   => time(),
  'ip'   => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
  'data' => json_decode($raw, true)
];

file_put_contents(
  $logDir . '/' . date('Y-m-d') . '.log',
  json_encode($entry) . PHP_EOL,
  FILE_APPEND
);

echo json_encode(['ok' => true]);