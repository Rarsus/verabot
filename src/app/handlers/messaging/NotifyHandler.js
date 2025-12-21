const CommandResult = require('../../../core/commands/CommandResult');

class NotifyHandler {
  constructor(discordClient) {
    this.discordClient = discordClient;
  }

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
