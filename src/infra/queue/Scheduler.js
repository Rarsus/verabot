class Scheduler {
  constructor(jobQueue, logger) {
    this.jobQueue = jobQueue;
    this.logger = logger;
  }

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
