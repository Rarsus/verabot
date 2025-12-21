const client = require('prom-client');

function createMetrics() {
  client.collectDefaultMetrics();

  const commandCounter = new client.Counter({
    name: 'command_executed_total',
    help: 'Total commands executed',
    labelNames: ['command', 'source']
  });

  const errorCounter = new client.Counter({
    name: 'command_errors_total',
    help: 'Total command errors',
    labelNames: ['command', 'source', 'code']
  });

  return { client, commandCounter, errorCounter };
}

module.exports = { createMetrics };
