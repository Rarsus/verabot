const http = require('http');
const { healthCheck } = require('../../infra/health/HealthCheck');

function createHealthMetricsServer(container) {
  const port = Number(container.config.HTTP_PORT || 3000);
  const metricsClient = container.metrics.client;

  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      const status = await healthCheck(container);
      const body = JSON.stringify(status);
      res.writeHead(status.status === 'ok' ? 200 : 500, {
        'Content-Type': 'application/json'
      });
      return res.end(body);
    }

    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': metricsClient.register.contentType });
      const metrics = await metricsClient.register.metrics();
      return res.end(metrics);
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    container.logger.info({ port }, 'Health/metrics server listening');
  });

  return server;
}

module.exports = { createHealthMetricsServer };
