const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for updating an existing dare
 * @class UpdateDareHandler
 * @example
 * const handler = new UpdateDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class UpdateDareHandler {
  /**
   * Create a new UpdateDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle update dare command execution
   * @param {Command} command - Command with dare ID and updates in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const id = command.metadata.id;

      if (!id) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const updates = {};

      if (command.metadata.content !== undefined) {
        updates.content = command.metadata.content;
      }
      if (command.metadata.status !== undefined) {
        updates.status = command.metadata.status;
      }

      if (Object.keys(updates).length === 0) {
        return CommandResult.fail(new Error('At least one field to update is required'));
      }

      await this.dareService.updateDare(id, updates);

      return CommandResult.ok({
        message: `Dare #${id} updated successfully`,
        dareId: id,
        updates,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = UpdateDareHandler;
