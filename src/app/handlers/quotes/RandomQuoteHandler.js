const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for getting a random quote
 * @class RandomQuoteHandler
 * @example
 * const handler = new RandomQuoteHandler(quoteService);
 * const result = await handler.handle(command);
 */
class RandomQuoteHandler {
  /**
   * Create a new RandomQuoteHandler instance
   * @param {Object} quoteService - Quote service with business logic methods
   */
  constructor(quoteService) {
    /** @type {Object} */
    this.quoteService = quoteService;
  }

  /**
   * Handle random quote command execution
   * @param {Command} [command] - Command object (unused)
   * @returns {Promise<CommandResult>} Random quote object or error message
   */
  async handle() {
    try {
      const quote = await this.quoteService.getRandomQuote();

      if (!quote) {
        return CommandResult.fail('No quotes available');
      }

      return CommandResult.ok({
        quote,
        formatted: `> ${quote.text}\n— ${quote.author}`,
      });
    } catch (error) {
      return CommandResult.fail(error.message);
    }
  }
}

module.exports = RandomQuoteHandler;
