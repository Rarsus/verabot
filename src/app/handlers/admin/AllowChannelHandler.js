const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for allow channel command - grants channel permission for a command
 * @class AllowChannelHandler
 * @example
 * const handler = new AllowChannelHandler(repos);
 * const result = await handler.handle(command);
 */
class AllowChannelHandler {
  /**
   * Create a new AllowChannelHandler instance
   * @param {Object} repos - Repository container with permissionRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle allow channel command execution
   * @param {Command} command - Command with args [commandName, channelId]
   * @returns {Promise<CommandResult>} Success or error result
   */
  async handle(command) {
    const [cmd, channelId] = command.args;
    if (!cmd || !channelId) {
      return CommandResult.fail(new Error('Usage: command <name> channel <id>'));
    }
    await this.repos.permissionRepo.addChannel(cmd, channelId);
    return CommandResult.ok({ message: `Channel ${channelId} allowed for '${cmd}'.` });
  }
}

module.exports = AllowChannelHandler;
