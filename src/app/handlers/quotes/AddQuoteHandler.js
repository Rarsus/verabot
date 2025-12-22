const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for adding new quotes
 * @class AddQuoteHandler
 * @example
 * const handler = new AddQuoteHandler(quoteService);
 * const result = await handler.handle(command);
 */
class AddQuoteHandler {
  /**
   * Create a new AddQuoteHandler instance
   * @param {Object} quoteService - Quote service with business logic methods
   */
  constructor(quoteService) {
    /** @type {Object} */
    this.quoteService = quoteService;
  }

  /**
   * Handle add quote command execution
   * @param {Command} command - Command with text and optional author in metadata
   * @returns {Promise<CommandResult>} Success message with quote ID
   */
  async handle(command) {
    try {
      const text = command.metadata.text;
      const author = command.metadata.author || 'Anonymous';
      const addedBy = command.userId;

      if (!text) {
        return CommandResult.fail('Quote text is required');
      }

      const quoteId = await this.quoteService.addQuote(text, author, addedBy);
      return CommandResult.ok({
        message: `Quote #${quoteId} added successfully!`,
        quoteId,
      });
    } catch (error) {
      return CommandResult.fail(error.message);
    }
  }
}

module.exports = AddQuoteHandler;
