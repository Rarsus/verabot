const { Queue, Worker, QueueScheduler } = require('bullmq');

class JobQueueService {
  constructor(redisConnection, logger) {
    this.logger = logger;

    this.queue = new Queue('commands', {
      connection: redisConnection
    });

    this.scheduler = new QueueScheduler('commands', {
      connection: redisConnection
    });

    this.worker = new Worker(
      'commands',
      async (job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing job');
        const handler = job.data.handler;
        const payload = job.data.payload;

        if (handler === 'heavywork') {
          await new Promise((res) => setTimeout(res, 2000));
          logger.info({ payload }, 'Heavywork job logic executed');
        } else if (handler && handler.startsWith('cron:')) {
          logger.info({ handler, payload }, 'Cron job executed');
        } else {
          logger.warn({ handler }, 'Unknown handler in job queue');
        }

        return { ok: true };
      },
      { connection: redisConnection }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Job completed');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Job failed');
    });
  }

  async enqueue(handler, payload, opts = {}) {
    return this.queue.add(handler, { handler, payload }, opts);
  }
}

module.exports = JobQueueService;
