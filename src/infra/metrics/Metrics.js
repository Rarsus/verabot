const client = require('prom-client');

/**
 * Create Prometheus metrics collectors
 * Initializes default metrics and custom command/error counters
 * @returns {Object} Metrics object with Prometheus client and counter instances
 * @returns {Object} returns.client - Prometheus client with registry
 * @returns {prom-client.Counter} returns.commandCounter - Counter tracking executed commands (labels: command, source)
 * @returns {prom-client.Counter} returns.errorCounter - Counter tracking command errors (labels: command, source, code)
 * @example
 * const { client, commandCounter, errorCounter } = createMetrics();
 * commandCounter.inc({ command: 'ping', source: 'discord' });
 * errorCounter.inc({ command: 'help', source: 'websocket', code: 'PERMISSION_DENIED' });
 * // Expose metrics: app.get('/metrics', (req, res) => { res.send(client.register.metrics()); });
 */
function createMetrics() {
  client.collectDefaultMetrics();

  const commandCounter = new client.Counter({
    name: 'command_executed_total',
    help: 'Total commands executed',
    labelNames: ['command', 'source'],
  });

  const errorCounter = new client.Counter({
    name: 'command_errors_total',
    help: 'Total command errors',
    labelNames: ['command', 'source', 'code'],
  });

  return { client, commandCounter, errorCounter };
}

module.exports = { createMetrics };
