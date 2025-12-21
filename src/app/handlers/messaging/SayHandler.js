const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for say command - broadcasts message via message service
 * @class SayHandler
 * @example
 * const handler = new SayHandler(messageService);
 * const result = await handler.handle(command);
 */
class SayHandler {
  /**
   * Create a new SayHandler instance
   * @param {Object} messageService - Message service with broadcast method
   */
  constructor(messageService) {
    /** @type {Object} */
    this.messageService = messageService;
  }

  /**
   * Handle say command execution
   * @param {Command} command - Command with message text in args
   * @returns {Promise<CommandResult>} The broadcast message text
   */
  async handle(command) {
    const text = command.args.join(' ') || 'Nothing to say.';
    await this.messageService.broadcast(command, text);
    return CommandResult.ok({ message: text });
  }
}

module.exports = SayHandler;

