const CommandResult = require('../../../core/commands/CommandResult');

class InfoHandler {
  constructor(statusProvider) {
    this.statusProvider = statusProvider;
  }

  async handle() {
    const status = await this.statusProvider.getStatus();
    return CommandResult.ok(status);
  }
}

module.exports = InfoHandler;
