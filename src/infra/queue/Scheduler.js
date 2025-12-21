/**
 * Scheduler for managing cron jobs and recurring tasks
 * Registers background jobs with the job queue service
 * @class Scheduler
 * @example
 * const scheduler = new Scheduler(jobQueue, logger);
 * await scheduler.registerCronJobs();
 */
class Scheduler {
  /**
   * Create a new Scheduler instance
   * @param {JobQueueService} jobQueue - Job queue service for enqueueing jobs
   * @param {Object} logger - Logger instance
   */
  constructor(jobQueue, logger) {
    /** @type {JobQueueService} */
    this.jobQueue = jobQueue;
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Register all cron jobs
   * Sets up recurring jobs like heartbeat monitoring
   * @returns {Promise<void>}
   */
  async registerCronJobs() {
    this.logger.info('Registering cron jobs');

    await this.jobQueue.queue.add(
      'cron:heartbeat',
      { timestamp: Date.now() },
      {
        repeat: { cron: '* * * * *' },
        removeOnComplete: true
      }
    );
  }
}

module.exports = Scheduler;
