<?php
/**
 * rs-token.php (Player server)
 * Returns JSON: {"token": "<wmsAuthSign>"}
 *
 * Validates the SAME embed signature passed to rs-media.php so random callers can't mint tokens.
 */
$cfgPath = __DIR__ . '/../config.php';
if (!file_exists($cfgPath)) { http_response_code(500); header('Content-Type: application/json'); echo json_encode(['error'=>'Missing config']); exit; }
$CFG = require $cfgPath;

function q($k, $default=''){ return isset($_GET[$k]) ? (string)$_GET[$k] : $default; }
function clean_id($s){ $s=preg_replace('/[^A-Z0-9_\\-]/i','',(string)$s); return substr($s,0,64); }
function hmac_hex($secret, $data){ return hash_hmac('sha256',$data,$secret); }
function timing_safe_eq($a,$b){ return function_exists('hash_equals') ? hash_equals($a,$b) : ($a===$b); }

$cam = clean_id(q('cam'));
$dev = (q('dev','0') === '1') ? 1 : 0;
$exp = (int)q('exp','0');
$sig = strtolower(preg_replace('/[^a-f0-9]/i','',q('sig','')));

if ($cam==='' || $exp<=0 || $sig===''){ http_response_code(403); header('Content-Type: application/json'); echo json_encode(['error'=>'bad request']); exit; }
if (time() > $exp){ http_response_code(403); header('Content-Type: application/json'); echo json_encode(['error'=>'expired']); exit; }

// IMPORTANT: This must match the canon string in rs-media.php and Joomla generator.
// Here we only have cam/dev/exp, so we accept a reduced canon too (keeps refresh simple).
$canon = $cam . '|' . '' . '|' . '' . '|' . $dev . '|' . $exp;
$want  = hmac_hex($CFG['embed_hmac_secret'], $canon);
if (!timing_safe_eq($want, $sig)){
  http_response_code(403);
  header('Content-Type: application/json');
  echo json_encode(['error'=>'bad sig']);
  exit;
}

function buildNimbleToken($secret, $ttlSeconds){
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $start = time();
  $end   = $start + max(60, (int)$ttlSeconds);
  $path  = '';
  $hash  = md5($ip . $path . $end . $secret);
  return $start . '_' . $end . '_' . $hash;
}

$token = buildNimbleToken($CFG['nimble_secure_secret'], (int)$CFG['token_ttl_seconds']);
header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode(['token'=>$token], JSON_UNESCAPED_SLASHES);
