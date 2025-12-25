const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for creating new dares from Perchance API
 * @class CreateDareHandler
 * @example
 * const handler = new CreateDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class CreateDareHandler {
  /**
   * Create a new CreateDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle create dare command execution
   * @param {Command} command - Command with userId
   * @returns {Promise<CommandResult>} Success message with dare ID and content
   */
  async handle(command) {
    try {
      const createdBy = command.userId;

      const dare = await this.dareService.createDare(createdBy);

      return CommandResult.ok({
        message: `Dare #${dare.id} created successfully!`,
        dareId: dare.id,
        content: dare.content,
        source: dare.source,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = CreateDareHandler;
