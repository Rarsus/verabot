const os = require('os');
const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for stats command - returns system performance statistics
 * @class StatsHandler
 * @example
 * const handler = new StatsHandler();
 * const result = await handler.handle();
 */
class StatsHandler {
  /**
   * Handle stats command execution
   * @param {Command} [command] - The command object (unused)
   * @returns {Promise<CommandResult>} System statistics including uptime, load, and memory
   */
  async handle() {
    const load = os.loadavg();
    const mem = process.memoryUsage();
    return CommandResult.ok({
      uptime: process.uptime(),
      loadavg: load,
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal
      }
    });
  }
}

module.exports = StatsHandler;

