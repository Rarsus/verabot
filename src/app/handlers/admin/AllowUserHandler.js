const CommandResult = require('../../../core/commands/CommandResult');

class AllowUserHandler {
  constructor(repos) {
    this.repos = repos;
  }

  async handle(command) {
    const [cmd, userId] = command.args;
    if (!cmd || !userId) {
      return CommandResult.fail(new Error('Usage: command <name> user <id>'));
    }
    await this.repos.permissionRepo.addUser(cmd, userId);
    return CommandResult.ok({ message: `User ${userId} allowed for '${cmd}'.` });
  }
}

module.exports = AllowUserHandler;
