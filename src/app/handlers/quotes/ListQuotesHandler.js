const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for listing all quotes
 * @class ListQuotesHandler
 * @example
 * const handler = new ListQuotesHandler(quoteService);
 * const result = await handler.handle(command);
 */
class ListQuotesHandler {
  /**
   * Create a new ListQuotesHandler instance
   * @param {Object} quoteService - Quote service with business logic methods
   */
  constructor(quoteService) {
    /** @type {Object} */
    this.quoteService = quoteService;
  }

  /**
   * Handle list quotes command execution
   * @param {Command} [command] - Command object (unused)
   * @returns {Promise<CommandResult>} Array of all quotes
   */
  async handle() {
    const quotes = await this.quoteService.getAllQuotes();

    if (!quotes || quotes.length === 0) {
      return CommandResult.fail(new Error('No quotes available'));
    }

    const count = quotes.length;
    return CommandResult.ok({
      quotes,
      count,
      message: `Found ${count} quote${count !== 1 ? 's' : ''}`,
    });
  }
}

module.exports = ListQuotesHandler;
