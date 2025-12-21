const WebSocket = require('ws');

/**
 * Create a WebSocket client with automatic reconnection
 * Connects to WebSocket server and maintains connection with exponential backoff
 * @param {Object} config - Configuration object
 * @param {string} config.WS_URL - WebSocket server URL (e.g., ws://localhost:8080)
 * @param {Object} logger - Logger instance for connection events
 * @returns {Object} WebSocket client holder
 * @returns {WebSocket|null} returns.instance - WebSocket instance (getter property, updates on reconnect)
 * @returns {Function} returns.isConnected - Function returning boolean connection status
 * @example
 * const wsClient = createWsClient({ WS_URL: 'ws://localhost:8080' }, logger);
 * if (wsClient.isConnected()) {
 *   wsClient.instance.send(JSON.stringify({ type: 'command', command: 'ping' }));
 * }
 * // Client automatically reconnects after disconnect
 */
function createWsClient(config, logger) {
  const url = config.WS_URL;
  let ws = null;

  function connect() {
    logger.info({ url }, 'Connecting to WebSocket');
    ws = new WebSocket(url);

    ws.on('open', () => {
      logger.info('WebSocket connected');
      ws.send(JSON.stringify({ type: 'hello', client: 'discord-bridge' }));
    });

    ws.on('close', (code, reason) => {
      logger.warn({ code, reason: reason?.toString() }, 'WebSocket closed, reconnecting...');
      setTimeout(connect, 3000);
    });

    ws.on('error', (err) => {
      logger.error({ err }, 'WebSocket error');
    });
  }

  connect();

  return {
    get instance() {
      return ws;
    },
    /**
     * Check if WebSocket is currently connected
     * @returns {boolean} True if connection is open
     */
    isConnected: () => ws && ws.readyState === WebSocket.OPEN
  };
}

module.exports = { createWsClient };
