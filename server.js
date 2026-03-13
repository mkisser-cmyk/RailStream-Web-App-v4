// ─────────────────────────────────────────────────────────────
// RailStream Production Server — Multi-Core Clustering
// ─────────────────────────────────────────────────────────────
// Uses Node.js cluster module to fork one worker per CPU core.
// Each worker runs a full Next.js server instance.
// The master process load-balances requests (round-robin) and
// relays chat/SSE messages between workers so all connected
// clients see every message regardless of which worker they hit.
//
// Usage:
//   yarn build            # compile Next.js for production
//   node server.js        # start clustered production server
//   pm2 start server.js --name railstream  # managed by PM2
// ─────────────────────────────────────────────────────────────

const cluster = require('cluster');
const os = require('os');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Allow overriding the number of workers (default: all CPU cores)
const NUM_WORKERS = parseInt(process.env.WORKERS, 10) || os.cpus().length;

if (cluster.isPrimary) {
  // ── Master Process ──
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  RailStream Production Server                    ║`);
  console.log(`║  Master PID: ${String(process.pid).padEnd(36)}║`);
  console.log(`║  CPU Cores:  ${String(os.cpus().length).padEnd(36)}║`);
  console.log(`║  Workers:    ${String(NUM_WORKERS).padEnd(36)}║`);
  console.log(`║  Port:       ${String(PORT).padEnd(36)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

  // Fork workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    spawnWorker(i);
  }

  // Auto-restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    const workerId = worker.process.env?.WORKER_ID || '?';
    console.warn(`[Master] Worker ${worker.process.pid} (id=${workerId}) died (code=${code}, signal=${signal}). Restarting...`);
    setTimeout(() => spawnWorker(parseInt(workerId) || 0), 1000);
  });

  function spawnWorker(id) {
    const worker = cluster.fork({
      WORKER_ID: String(id),
    });

    worker.on('message', (msg) => {
      if (!msg) return;
      
      // ── Chat Message Relay ──
      if (msg._relay) {
        for (const wid in cluster.workers) {
          const target = cluster.workers[wid];
          if (target && target !== worker && !target.isDead()) {
            try { target.send(msg); } catch (e) { /* Worker may be shutting down */ }
          }
        }
      }
    });

    console.log(`[Master] Worker ${worker.process.pid} started (id=${id})`);
    return worker;
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Master] Shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

} else {
  // ── Worker Process ──
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  const app = next({
    dev: false,
    hostname: HOST,
    port: PORT,
  });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(PORT, HOST, () => {
      console.log(`[Worker ${process.pid}] Ready on http://${HOST}:${PORT}`);
    });
  });
}
