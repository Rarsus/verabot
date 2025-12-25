const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for deleting a dare from the database
 * @class DareDeleteHandler
 * @example
 * const handler = new DareDeleteHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareDeleteHandler {
  /**
   * Create a new DareDeleteHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare delete command execution
   * @param {Command} command - Command with dare_id in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const dareId = command.metadata.dare_id;

      if (!dareId) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const success = await this.dareService.deleteDare(dareId);

      if (!success) {
        return CommandResult.fail(new Error(`Failed to delete dare #${dareId}`));
      }

      return CommandResult.ok({
        message: `Dare #${dareId} deleted successfully!`,
        dareId,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareDeleteHandler;
