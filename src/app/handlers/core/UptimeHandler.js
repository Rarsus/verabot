const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for uptime command - returns process uptime
 * @class UptimeHandler
 * @example
 * const handler = new UptimeHandler();
 * const result = await handler.handle();
 */
class UptimeHandler {
  /**
   * Handle uptime command execution
   * @param {Command} [command] - The command object (unused)
   * @returns {Promise<CommandResult>} Process uptime in seconds
   */
  async handle() {
    return CommandResult.ok({ uptimeSeconds: process.uptime() });
  }
}

module.exports = UptimeHandler;

