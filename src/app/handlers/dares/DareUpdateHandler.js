const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for updating an existing dare
 * @class DareUpdateHandler
 * @example
 * const handler = new DareUpdateHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareUpdateHandler {
  /**
   * Create a new DareUpdateHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare update command execution
   * @param {Command} command - Command with dare_id and update fields in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const dareId = command.metadata.dare_id;

      if (!dareId) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const updates = {};

      if (command.metadata.content !== undefined) {
        updates.content = command.metadata.content;
      }
      if (command.metadata.status !== undefined) {
        updates.status = command.metadata.status;
      }
      if (command.metadata.theme !== undefined) {
        updates.theme = command.metadata.theme;
      }

      if (Object.keys(updates).length === 0) {
        return CommandResult.fail(new Error('No update fields provided'));
      }

      const success = await this.dareService.updateDare(dareId, updates);

      if (!success) {
        return CommandResult.fail(new Error(`Failed to update dare #${dareId}`));
      }

      return CommandResult.ok({
        message: `Dare #${dareId} updated successfully!`,
        dareId,
        updates,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareUpdateHandler;
