const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for allow user command - grants user permission for a command
 * @class AllowUserHandler
 * @example
 * const handler = new AllowUserHandler(repos);
 * const result = await handler.handle(command);
 */
class AllowUserHandler {
  /**
   * Create a new AllowUserHandler instance
   * @param {Object} repos - Repository container with permissionRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle allow user command execution
   * @param {Command} command - Command with args [commandName, userId]
   * @returns {Promise<CommandResult>} Success or error result
   */
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
