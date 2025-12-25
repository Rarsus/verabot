const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for deleting a dare
 * @class DeleteDareHandler
 * @example
 * const handler = new DeleteDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class DeleteDareHandler {
  /**
   * Create a new DeleteDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle delete dare command execution
   * @param {Command} command - Command with dare ID in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const id = command.metadata.id;

      if (!id) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      await this.dareService.deleteDare(id);

      return CommandResult.ok({
        message: `Dare #${id} deleted successfully`,
        dareId: id,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = DeleteDareHandler;
