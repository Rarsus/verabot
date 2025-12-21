const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for info command - returns system information
 * @class InfoHandler
 * @example
 * const handler = new InfoHandler(statusProvider);
 * const result = await handler.handle();
 */
class InfoHandler {
  /**
   * Create a new InfoHandler instance
   * @param {Object} statusProvider - Provider with getStatus() method
   */
  constructor(statusProvider) {
    /** @type {Object} */
    this.statusProvider = statusProvider;
  }

  /**
   * Handle info command execution
   * @param {Command} [command] - The command object (unused)
   * @returns {Promise<CommandResult>} System status information
   */
  async handle() {
    const status = await this.statusProvider.getStatus();
    return CommandResult.ok(status);
  }
}

module.exports = InfoHandler;

