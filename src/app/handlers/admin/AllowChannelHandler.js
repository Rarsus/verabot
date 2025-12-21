const CommandResult = require('../../../core/commands/CommandResult');

class AllowChannelHandler {
  constructor(repos) {
    this.repos = repos;
  }

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
