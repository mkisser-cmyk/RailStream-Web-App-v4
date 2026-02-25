<?php
/**
 * RailStream Player - Server config
 * Put this OUTSIDE the web root if possible (recommended).
 *
 * REQUIRED: set your Nimble secure-link secret + your edge base URL template.
 */

return [
  // Used to sign incoming embed requests from Joomla -> player server
  // (Set the same value on the Joomla side when building the iframe URL)
  'embed_hmac_secret' => 'CHANGE_ME_LONG_RANDOM',

  // Nimble Secure Token (wmsAuthSign) secret used by your edge for protected playlists
  // (This is the secret you already use today for Nimble secure links)
  'nimble_secure_secret' => 'CHANGE_ME_NIMBLE_SECRET',

  // Edge base prefix (no trailing CAMID here; rs-media.php appends CAMID)
  // Example: https://edge01.railstream.net/Live_Web/
  'edge_base_prefix' => 'https://edge01.railstream.net/Live_Web/',

  // Thumbnails base (your Apache Alias points /thumbs -> NFS mount)
  'thumbs_prefix' => '/thumbs/',

  // Default DVR behavior
  'dvr_days_default' => 7,
  'chunk_hours_default' => 1,

  // Token validity / rotation
  'token_ttl_seconds' => 600,           // 10 minutes
  'token_rotate_ms'   => 9 * 60 * 1000, // JS will rotate around this
];
