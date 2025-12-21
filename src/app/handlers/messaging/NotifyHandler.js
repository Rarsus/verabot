const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for notify command - sends direct message to a user
 * @class NotifyHandler
 * @example
 * const handler = new NotifyHandler(discordClient);
 * const result = await handler.handle(command);
 */
class NotifyHandler {
  /**
   * Create a new NotifyHandler instance
   * @param {Client} discordClient - Discord.js client instance
   */
  constructor(discordClient) {
    /** @type {Client} */
    this.discordClient = discordClient;
  }

  /**
   * Handle notify command execution
   * @param {Command} command - Command with args [userId, ...messageText]
   * @returns {Promise<CommandResult>} Success or error result
   */
  async handle(command) {
    const [userId, ...msgParts] = command.args;
    if (!userId) return CommandResult.fail(new Error('Missing user ID'));
    const text = msgParts.join(' ') || '(no message)';

    try {
      const user = await this.discordClient.users.fetch(userId);
      await user.send(text);
      return CommandResult.ok({ message: `DM sent to ${userId}` });
    } catch (err) {
      return CommandResult.fail(new Error(`Failed to DM user: ${err.message}`));
    }
  }
}

module.exports = NotifyHandler;
