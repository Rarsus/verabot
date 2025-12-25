const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for getting a specific dare by ID
 * @class GetDareHandler
 * @example
 * const handler = new GetDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class GetDareHandler {
  /**
   * Create a new GetDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle get dare command execution
   * @param {Command} command - Command with dare ID in metadata
   * @returns {Promise<CommandResult>} Dare object
   */
  async handle(command) {
    try {
      const id = command.metadata.id;

      if (!id) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const dare = await this.dareService.getDareById(id);

      if (!dare) {
        return CommandResult.fail(new Error(`Dare #${id} not found`));
      }

      return CommandResult.ok({
        dare,
        message: `Dare #${id} retrieved successfully`,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = GetDareHandler;
