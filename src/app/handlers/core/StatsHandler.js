const os = require('os');
const CommandResult = require('../../../core/commands/CommandResult');

class StatsHandler {
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
