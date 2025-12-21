const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for job status command - retrieves background job status and progress
 * @class JobStatusHandler
 * @example
 * const handler = new JobStatusHandler(jobQueue);
 * const result = await handler.handle(command);
 */
class JobStatusHandler {
  /**
   * Create a new JobStatusHandler instance
   * @param {Object} jobQueue - Job queue service with queue property
   */
  constructor(jobQueue) {
    /** @type {Object} */
    this.jobQueue = jobQueue;
  }

  /**
   * Handle job status command execution
   * @param {Command} command - Command with args [jobId]
   * @returns {Promise<CommandResult>} Job state, progress, and return value
   * @throws Returns error result if job not found
   */
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
