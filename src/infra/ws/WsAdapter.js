const Command = require('../../core/commands/Command');

class WsAdapter {
  constructor(wsHolder, commandBus, logger) {
    this.wsHolder = wsHolder;
    this.bus = commandBus;
    this.logger = logger;
  }

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
          metadata: payload.metadata || {}
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
              error: { code: err.code || 'ERROR', message: err.message }
            })
          );
        }
      });
    };

    attach();
  }
}

module.exports = WsAdapter;
