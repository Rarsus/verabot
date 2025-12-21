const Command = require('../../core/commands/Command');

/**
 * Adapter for handling WebSocket command interactions
 * Converts incoming WebSocket messages to Command objects and executes them through the bus
 * @class WsAdapter
 * @example
 * const adapter = new WsAdapter(wsHolder, commandBus, logger);
 * adapter.registerListeners();
 */
class WsAdapter {
  /**
   * Create a new WsAdapter instance
   * @param {Object} wsHolder - WebSocket holder with instance property
   * @param {CommandBus} commandBus - Command bus for execution
   * @param {Object} logger - Logger instance
   */
  constructor(wsHolder, commandBus, logger) {
    /** @type {Object} */
    this.wsHolder = wsHolder;
    /** @type {CommandBus} */
    this.bus = commandBus;
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Register WebSocket message listeners
   * Attaches handlers for incoming command messages and sets up response/error handling
   * Waits for WebSocket connection if not immediately available
   * @returns {void}
   */
  registerListeners() {
    const attach = () => {
      const ws = this.wsHolder.instance;
      if (!ws) {
        setTimeout(attach, 1000);
        return;
      }

      ws.on('message', async (data) => {
        let payload;
        try {
          payload = JSON.parse(data.toString());
        } catch {
          this.logger.warn('Received non-JSON WS message');
          return;
        }
        if (payload.type !== 'command') return;

        const command = new Command({
          name: payload.command,
          source: 'websocket',
          userId: payload.userId || null,
          channelId: null,
          args: payload.args || [],
          metadata: payload.metadata || {},
        });

        try {
          const result = await this.bus.execute(command);
          ws.send(JSON.stringify({ type: 'response', command: command.name, result }));
        } catch (err) {
          this.logger.error({ err }, 'WS command error');
          ws.send(
            JSON.stringify({
              type: 'error',
              command: command.name,
              error: { code: err.code || 'ERROR', message: err.message },
            })
          );
        }
      });
    };

    attach();
  }
}

module.exports = WsAdapter;
