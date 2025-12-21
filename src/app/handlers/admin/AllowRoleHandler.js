const CommandResult = require('../../../core/commands/CommandResult');

class AllowRoleHandler {
  constructor(repos) {
    this.repos = repos;
  }

  async handle(command) {
    const [cmd, roleId] = command.args;
    if (!cmd || !roleId) {
      return CommandResult.fail(new Error('Usage: command <name> role <id>'));
    }
    await this.repos.permissionRepo.addRole(cmd, roleId);
    return CommandResult.ok({ message: `Role ${roleId} allowed for '${cmd}'.` });
  }
}

module.exports = AllowRoleHandler;
