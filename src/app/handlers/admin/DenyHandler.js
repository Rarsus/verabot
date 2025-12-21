const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for deny command - removes a command from the allowlist
 * @class DenyHandler
 * @example
 * const handler = new DenyHandler(repos);
 * const result = await handler.handle(command);
 */
class DenyHandler {
  /**
   * Create a new DenyHandler instance
   * @param {Object} repos - Repository container with commandRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle deny command execution
   * @param {Command} command - Command with args [commandName]
   * @returns {Promise<CommandResult>} Success or error result
   */
  async handle(command) {
    const name = command.args[0];
    if (!name) return CommandResult.fail(new Error('Missing command name'));
    await this.repos.commandRepo.removeAllowed(name);
    return CommandResult.ok({ message: `Command '${name}' is now denied.` });
  }
}

module.exports = DenyHandler;

