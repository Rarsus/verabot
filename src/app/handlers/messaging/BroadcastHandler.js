const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for broadcast command - sends message to all text channels
 * @class BroadcastHandler
 * @example
 * const handler = new BroadcastHandler(discordClient);
 * const result = await handler.handle(command);
 */
class BroadcastHandler {
  /**
   * Create a new BroadcastHandler instance
   * @param {Client} discordClient - Discord.js client instance
   */
  constructor(discordClient) {
    /** @type {Client} */
    this.discordClient = discordClient;
  }

  /**
   * Handle broadcast command execution
   * @param {Command} command - Command with message text in args
   * @returns {Promise<CommandResult>} Number of channels message was sent to
   */
  async handle(command) {
    const text = command.args.join(' ');
    if (!text) return CommandResult.fail(new Error('No message provided'));

    let count = 0;
    for (const [, channel] of this.discordClient.channels.cache) {
      if (channel.isTextBased()) {
        try {
          await channel.send(text);
          count++;
        } catch {
          // ignore
        }
      }
    }
    return CommandResult.ok({ message: `Broadcast sent to ${count} channels` });
  }
}

module.exports = BroadcastHandler;

