const CommandResult = require('../../../core/commands/CommandResult');

class SayHandler {
  constructor(messageService) {
    this.messageService = messageService;
  }

  async handle(command) {
    const text = command.args.join(' ') || 'Nothing to say.';
    await this.messageService.broadcast(command, text);
    return CommandResult.ok({ message: text });
  }
}

module.exports = SayHandler;
