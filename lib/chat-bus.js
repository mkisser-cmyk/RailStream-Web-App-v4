// Shared Chat Event Bus
// Used by both chat/route.js and roundhouse/route.js for real-time SSE events
import { EventEmitter } from 'events';

// Singleton event bus — shared across all API routes in the same process
const chatBus = new EventEmitter();
chatBus.setMaxListeners(2000);

// ── Cross-Worker Message Relay (for clustered production server) ──
const isClusterWorker = typeof process.send === 'function';

function relayToOtherWorkers(event, data) {
  if (isClusterWorker) {
    try {
      process.send({ _relay: true, event, data });
    } catch (e) {
      // Worker might be shutting down
    }
  }
}

// Listen for relayed messages from master (originated by other workers)
if (isClusterWorker) {
  process.on('message', (packet) => {
    if (packet && packet._relay && packet.event && packet.data) {
      chatBus.emit(packet.event, packet.data);
    }
  });
}

export { chatBus, relayToOtherWorkers, isClusterWorker };
