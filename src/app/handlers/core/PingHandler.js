const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for the ping command - simple health check
 * @class PingHandler
 * @example
 * const handler = new PingHandler();
 * const result = await handler.handle();
 */
class PingHandler {
  /**
   * Handle ping command execution
   * @param {Command} [command] - The command object (unused)
   * @returns {Promise<CommandResult>} Simple pong response
   */
  async handle() {
    return CommandResult.ok({ message: 'pong' });
  }
}

module.exports = PingHandler;

