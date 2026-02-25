<?php
// /embed/v3.4.0/token.php
// Issues fresh wmsAuthSign tokens using the stateless HttpOnly cookie session from index.php.
// Returns: { token: "...", exp: <unix seconds> }

declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json; charset=utf-8');

// -----------------------------
// CONFIG (must match index.php)
// -----------------------------
$SESSION_SECRET = 'Ki$$leAndrea04';
$COOKIE_NAME   = 'RS_EMBED_SESS';

$WMS_KEY       = '* CJ4g3JwLzYcnFeUpZfrPGGcdkWPa2Cr6';
$WMS_VALIDMIN  = 15;

// -----------------------------
// Helpers
// -----------------------------
function fail(int $code, string $msg): void {
  http_response_code($code);
  echo json_encode(['error' => $msg], JSON_UNESCAPED_SLASHES);
  exit;
}
function b64url_decode(string $in): string {
  $in = strtr($in, '-_', '+/');
  $pad = strlen($in) % 4;
  if ($pad) $in .= str_repeat('=', 4 - $pad);
  $out = base64_decode($in, true);
  return $out === false ? '' : $out;
}
function timing_safe_equals(string $a, string $b): bool {
  return function_exists('hash_equals') ? hash_equals($a, $b) : $a === $b;
}
function hmac_hex(string $data, string $secret): string {
  return hash_hmac('sha256', $data, $secret);
}
function build_wms_auth(string $wmsKey, int $validMinutes): string {
  $today = gmdate("n/j/Y g:i:s A");
  $ip    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

  $str2hash   = $ip . $wmsKey . $today . $validMinutes;
  $md5raw     = md5($str2hash, true);
  $base64hash = base64_encode($md5raw);

  $urlsig = "server_time={$today}&hash_value={$base64hash}&validminutes={$validMinutes}";
  return base64_encode($urlsig);
}

// -----------------------------
// Read + verify cookie session
// -----------------------------
$cookie = $_COOKIE[$COOKIE_NAME] ?? '';
if (!is_string($cookie) || $cookie === '' || strpos($cookie, '.') === false) {
  fail(401, 'Missing session cookie');
}

[$sess_b64, $sig] = explode('.', $cookie, 2);
if ($sess_b64 === '' || $sig === '') fail(401, 'Bad session cookie');

$calc = hmac_hex($sess_b64, $SESSION_SECRET);
if (!timing_safe_equals(strtolower($calc), strtolower($sig))) {
  fail(401, 'Bad session signature');
}

$json = b64url_decode($sess_b64);
if ($json === '') fail(401, 'Bad session payload');

$sess = json_decode($json, true);
if (!is_array($sess)) fail(401, 'Bad session JSON');

$now = time();
$exp = isset($sess['exp']) ? (int)$sess['exp'] : 0;
if ($exp <= 0 || $now > $exp) fail(401, 'Session expired');

// Optional: light UA binding (kept forgiving)
$ua = substr(sha1($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 16);
if (isset($sess['ua']) && is_string($sess['ua']) && $sess['ua'] !== '' && $sess['ua'] !== $ua) {
  // If this causes false positives, remove it.
  // fail(401, 'Session mismatch');
}

// -----------------------------
// Return fresh token
// -----------------------------
echo json_encode([
  'token' => build_wms_auth($WMS_KEY, $WMS_VALIDMIN),
  'exp'   => $now + ($WMS_VALIDMIN * 60),
], JSON_UNESCAPED_SLASHES);