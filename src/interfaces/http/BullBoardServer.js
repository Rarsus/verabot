const express = require('express');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');

/**
 * Create Bull Board server for job queue visualization and management
 * Provides UI for viewing, managing, and monitoring background jobs
 * Runs on HTTP_PORT + 1 (default: 3001) at /admin/queues
 * @param {Object} container - Dependency injection container with jobQueue, config, logger
 * @returns {express.Application} Express application instance with Bull Board UI
 * @example
 * const app = createBullBoardServer(container);
 * // Access UI at http://localhost:3001/admin/queues
 * // View job queue status, retry failed jobs, clear queue, etc.
 */
function createBullBoardServer(container) {
  const app = express();
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(container.jobQueue.queue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = Number(container.config.HTTP_PORT || 3000) + 1;

  app.listen(port, () => {
    container.logger.info({ port }, 'Bull Board running');
  });

  return app;
}

module.exports = { createBullBoardServer };
