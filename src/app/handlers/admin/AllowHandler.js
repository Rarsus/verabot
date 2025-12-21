const CommandResult = require('../../../core/commands/CommandResult');

class AllowHandler {
  constructor(repos) {
    this.repos = repos;
  }

  async handle(command) {
    const name = command.args[0];
    if (!name) return CommandResult.fail(new Error('Missing command name'));
    await this.repos.commandRepo.addAllowed(name, command.userId);
    return CommandResult.ok({ message: `Command '${name}' is now allowed.` });
  }
}

module.exports = AllowHandler;
