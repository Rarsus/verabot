const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for allow command - adds a command to the allowlist
 * @class AllowHandler
 * @example
 * const handler = new AllowHandler(repos);
 * const result = await handler.handle(command);
 */
class AllowHandler {
  /**
   * Create a new AllowHandler instance
   * @param {Object} repos - Repository container with commandRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle allow command execution
   * @param {Command} command - Command with args [commandName]
   * @returns {Promise<CommandResult>} Success or error result
   */
  async handle(command) {
    const name = command.args[0];
    if (!name) return CommandResult.fail(new Error('Missing command name'));
    await this.repos.commandRepo.addAllowed(name, command.userId);
    return CommandResult.ok({ message: `Command '${name}' is now allowed.` });
  }
}

module.exports = AllowHandler;

