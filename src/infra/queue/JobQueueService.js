const { Queue, Worker, QueueScheduler } = require('bullmq');

/**
 * Background job queue service using BullMQ
 * Manages enqueueing, scheduling, and processing of background jobs
 * Supports handlers for heavy work and cron job execution
 * @class JobQueueService
 * @example
 * const jobQueue = new JobQueueService(redisConnection, logger);
 * await jobQueue.enqueue('heavywork', { data: 'value' }, { delay: 5000 });
 * // Or use with scheduler
 * const scheduler = new Scheduler(jobQueue, logger);
 * await scheduler.registerCronJobs();
 */
class JobQueueService {
  /**
   * Create a new JobQueueService instance
   * Sets up BullMQ queue, scheduler, and worker with event listeners
   * @param {Redis} redisConnection - Redis connection for job storage and coordination
   * @param {Object} logger - Logger instance for job processing logs
   */
  constructor(redisConnection, logger) {
    /** @type {Object} */
    this.logger = logger;

    /**
     * BullMQ Queue instance for enqueueing jobs
     * @type {Queue}
     */
    this.queue = new Queue('commands', {
      connection: redisConnection
    });

    /**
     * QueueScheduler for managing recurring jobs
     * @type {QueueScheduler}
     */
    this.scheduler = new QueueScheduler('commands', {
      connection: redisConnection
    });

    /**
     * Worker that processes jobs with appropriate handlers
     * Handles heavywork and cron job execution
     * @type {Worker}
     */
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

  /**
   * Enqueue a job for background processing
   * @param {string} handler - Job handler name (e.g., 'heavywork', 'cron:heartbeat')
   * @param {*} payload - Job payload data
   * @param {Object} opts - BullMQ job options
   * @param {number} opts.delay - Delay before processing in milliseconds
   * @param {number} opts.priority - Job priority (0 = highest)
   * @param {number} opts.attempts - Number of retry attempts
   * @param {Object} opts.repeat - Repeat pattern for recurring jobs (e.g., { cron: '* * * * *' })
   * @param {boolean} opts.removeOnComplete - Whether to remove job after completion
   * @returns {Promise<Job>} Enqueued job object with id and metadata
   * @example
   * const job = await jobQueue.enqueue('heavywork', { arg: 'value' }, { delay: 5000 });
   * console.log(job.id); // Job ID for tracking
   */
  async enqueue(handler, payload, opts = {}) {
    return this.queue.add(handler, { handler, payload }, opts);
  }
}

module.exports = JobQueueService;
