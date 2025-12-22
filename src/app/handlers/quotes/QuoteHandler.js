const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for retrieving a quote by ID
 * @class QuoteHandler
 * @example
 * const handler = new QuoteHandler(quoteService);
 * const result = await handler.handle(command);
 */
class QuoteHandler {
  /**
   * Create a new QuoteHandler instance
   * @param {Object} quoteService - Quote service with business logic methods
   */
  constructor(quoteService) {
    /** @type {Object} */
    this.quoteService = quoteService;
  }

  /**
   * Handle quote retrieval command execution
   * @param {Command} command - Command with quote ID in metadata
   * @returns {Promise<CommandResult>} Quote object or error message
   */
  async handle(command) {
    const id = command.metadata.id;

    if (!id) {
      return CommandResult.fail(new Error('Quote ID is required'));
    }

    const quote = await this.quoteService.getQuoteById(id);

    if (!quote) {
      return CommandResult.fail(new Error(`Quote #${id} not found`));
    }

    return CommandResult.ok({
      quote,
      formatted: `> ${quote.text}\n— ${quote.author}`,
    });
  }
}

module.exports = QuoteHandler;
