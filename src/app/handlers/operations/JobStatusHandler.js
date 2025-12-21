const CommandResult = require('../../../core/commands/CommandResult');

class JobStatusHandler {
  constructor(jobQueue) {
    this.jobQueue = jobQueue;
  }

  async handle(command) {
    const jobId = command.args[0];
    if (!jobId) return CommandResult.fail(new Error('Missing job ID'));

    const job = await this.jobQueue.queue.getJob(jobId);
    if (!job) return CommandResult.fail(new Error(`Job ${jobId} not found`));

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;

    return CommandResult.ok({ jobId, state, progress, returnValue });
  }
}

module.exports = JobStatusHandler;
