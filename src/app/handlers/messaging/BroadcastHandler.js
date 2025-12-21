const CommandResult = require('../../../core/commands/CommandResult');

class BroadcastHandler {
  constructor(discordClient) {
    this.discordClient = discordClient;
  }

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
