const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for searching quotes
 * @class SearchQuotesHandler
 * @example
 * const handler = new SearchQuotesHandler(quoteService);
 * const result = await handler.handle(command);
 */
class SearchQuotesHandler {
  /**
   * Create a new SearchQuotesHandler instance
   * @param {Object} quoteService - Quote service with business logic methods
   */
  constructor(quoteService) {
    /** @type {Object} */
    this.quoteService = quoteService;
  }

  /**
   * Handle search quotes command execution
   * @param {Command} command - Command with search query in metadata
   * @returns {Promise<CommandResult>} Array of matching quotes
   */
  async handle(command) {
    try {
      const query = command.metadata.query;

      if (!query) {
        return CommandResult.fail('Search query is required');
      }

      const quotes = await this.quoteService.searchQuotes(query);

      if (!quotes || quotes.length === 0) {
        return CommandResult.fail(`No quotes found matching "${query}"`);
      }

      const count = quotes.length;
      return CommandResult.ok({
        quotes,
        count,
        query,
        message: `Found ${count} quote${count !== 1 ? 's' : ''} matching "${query}"`,
      });
    } catch (error) {
      return CommandResult.fail(error.message);
    }
  }
}

module.exports = SearchQuotesHandler;
