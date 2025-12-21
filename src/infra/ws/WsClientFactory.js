const WebSocket = require('ws');

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
    isConnected: () => ws && ws.readyState === WebSocket.OPEN
  };
}

module.exports = { createWsClient };
