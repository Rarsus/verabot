const CommandResult = require('../../../core/commands/CommandResult');

class PingHandler {
  async handle() {
    return CommandResult.ok({ message: 'pong' });
  }
}

module.exports = PingHandler;
