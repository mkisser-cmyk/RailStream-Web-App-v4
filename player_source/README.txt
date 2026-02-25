RailStream Player Dev Bundle (for player.railstream.tv)

WEB ROOT ASSUMPTION:
  /var/www/player

PLACE FILES:
  /var/www/player/embed/rs-media.php
  /var/www/player/video/rs-token.php
  /var/www/player/assets/rs-media.js
  /var/www/player/assets/rs-player.css   (optional placeholder; replace with your real css)
  /var/www/player/config.php             (or move OUTSIDE webroot and update paths)

APACHE (you already have these aliases working):
  /health   -> /var/www/player/health/
  /assets   -> /var/www/player/assets/
  /thumbs   -> /thumbs (NFS)
  /telemetry -> /var/www/player/telemetry/
  /ai        -> /var/www/player/ai/

You also need to make /embed and /video reachable. Easiest is: they are inside DocumentRoot so no Alias needed.

CONFIG:
  Edit config.php:
   - embed_hmac_secret: shared secret between Joomla embed and this player host
   - nimble_secure_secret: your Nimble secure-link secret
   - edge_base_prefix: https://<edge>/Live_Web/
   - token format: rs-media.php uses a common MD5-based scheme; change buildNimbleToken() to match your Nimble config if needed.

JOOMLA SIDE (example signature):
  exp = time() + 300
  canon = "{$cam}|{$peersCsv}|{$labelsPipe}|{$dev}|{$exp}"
  sig = hash_hmac('sha256', $canon, EMBED_HMAC_SECRET)
  iframe = "https://player.railstream.tv/embed/rs-media.php?cam=...&peers=...&labels=...&dev=0&exp=...&sig=..."

TEST:
  curl -i "https://player.railstream.tv/embed/rs-media.php?..."   (should return HTML)
  curl -i "https://player.railstream.tv/video/rs-token.php?cam=FOS_CAM02&dev=0&exp=...&sig=..."  (should return JSON token)

