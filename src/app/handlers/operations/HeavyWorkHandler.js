const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for heavy work command - enqueues long-running background job
 * @class HeavyWorkHandler
 * @example
 * const handler = new HeavyWorkHandler(jobQueue);
 * const result = await handler.handle(command);
 */
class HeavyWorkHandler {
  /**
   * Create a new HeavyWorkHandler instance
   * @param {Object} jobQueue - Job queue service for task enqueueing
   */
  constructor(jobQueue) {
    /** @type {Object} */
    this.jobQueue = jobQueue;
  }

  /**
   * Handle heavy work command execution
   * @param {Command} command - Command with optional args
   * @returns {Promise<CommandResult>} Job ID and enqueue confirmation
   */
  async handle(command) {
    const payload = {
      userId: command.userId,
      source: command.source,
      args: command.args,
    };

    const job = await this.jobQueue.enqueue('heavywork', payload, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return CommandResult.ok({
      message: 'Heavy job queued',
      jobId: job.id,
    });
  }
}

module.exports = HeavyWorkHandler;
