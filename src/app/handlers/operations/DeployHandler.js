const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for deploy command - simulates deployment to target environment
 * @class DeployHandler
 * @example
 * const handler = new DeployHandler(logger);
 * const result = await handler.handle(command);
 */
class DeployHandler {
  /**
   * Create a new DeployHandler instance
   * @param {Object} logger - Logger instance
   */
  constructor(logger) {
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Handle deploy command execution
   * @param {Command} command - Command with args [target]
   * @returns {Promise<CommandResult>} Deployment completion message
   */
  async handle(command) {
    const target = command.args[0] || 'production';
    this.logger.info({ target }, 'Simulating deployment');
    await new Promise((res) => setTimeout(res, 1500));
    return CommandResult.ok({ message: `Deployment to ${target} completed successfully` });
  }
}

module.exports = DeployHandler;
