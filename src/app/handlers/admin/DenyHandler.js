const CommandResult = require('../../../core/commands/CommandResult');

class DenyHandler {
  constructor(repos) {
    this.repos = repos;
  }

  async handle(command) {
    const name = command.args[0];
    if (!name) return CommandResult.fail(new Error('Missing command name'));
    await this.repos.commandRepo.removeAllowed(name);
    return CommandResult.ok({ message: `Command '${name}' is now denied.` });
  }
}

module.exports = DenyHandler;
