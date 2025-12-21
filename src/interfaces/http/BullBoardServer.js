const express = require('express');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');

function createBullBoardServer(container) {
  const app = express();
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(container.jobQueue.queue)],
    serverAdapter
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = Number(container.config.HTTP_PORT || 3000) + 1;

  app.listen(port, () => {
    container.logger.info({ port }, 'Bull Board running');
  });

  return app;
}

module.exports = { createBullBoardServer };
