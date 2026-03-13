// PM2 Ecosystem Configuration for RailStream
// ─────────────────────────────────────────────
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 restart railstream
//   pm2 logs railstream
//   pm2 monit              (real-time CPU/memory dashboard)
//
// NOTE: We use fork mode (instances: 1) because server.js
// handles clustering internally via Node.js cluster module.
// This gives us cross-worker chat message relay that PM2
// cluster mode can't provide out of the box.

module.exports = {
  apps: [{
    name: 'railstream',
    script: 'server.js',
    
    // Fork mode — server.js does its own clustering internally
    // This is intentional: our custom cluster master relays chat
    // messages between workers, which PM2 cluster mode can't do.
    instances: 1,
    exec_mode: 'fork',
    
    // Auto-restart
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 2000,
    
    // Memory limit — restart if exceeded (adjust to your VM)
    max_memory_restart: '2G',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
      // WORKERS: 'auto' means use all CPU cores (default)
      // Set to a specific number to limit: WORKERS=2
    },
    
    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/railstream/error.log',
    out_file: '/var/log/railstream/out.log',
    merge_logs: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // Node.js flags for production
    node_args: [
      '--max-old-space-size=2048',  // 2GB heap (adjust to your VM RAM)
      '--optimize-for-size',         // Prefer smaller memory footprint
    ],
  }],
};
