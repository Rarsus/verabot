const CommandResult = require('../../../core/commands/CommandResult');

class HeavyWorkHandler {
  constructor(jobQueue) {
    this.jobQueue = jobQueue;
  }

  async handle(command) {
    const payload = {
      userId: command.userId,
      source: command.source,
      args: command.args
    };

    const job = await this.jobQueue.enqueue('heavywork', payload, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false
    });

    return CommandResult.ok({
      message: 'Heavy job queued',
      jobId: job.id
    });
  }
}

module.exports = HeavyWorkHandler;
