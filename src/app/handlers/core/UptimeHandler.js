const CommandResult = require('../../../core/commands/CommandResult');

class UptimeHandler {
  async handle() {
    return CommandResult.ok({ uptimeSeconds: process.uptime() });
  }
}

module.exports = UptimeHandler;
