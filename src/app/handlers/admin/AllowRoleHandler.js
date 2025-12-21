const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for allow role command - grants role permission for a command
 * @class AllowRoleHandler
 * @example
 * const handler = new AllowRoleHandler(repos);
 * const result = await handler.handle(command);
 */
class AllowRoleHandler {
  /**
   * Create a new AllowRoleHandler instance
   * @param {Object} repos - Repository container with permissionRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle allow role command execution
   * @param {Command} command - Command with args [commandName, roleId]
   * @returns {Promise<CommandResult>} Success or error result
   */
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

