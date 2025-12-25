const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for marking a dare as completed
 * @class DareCompleteHandler
 * @example
 * const handler = new DareCompleteHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareCompleteHandler {
  /**
   * Create a new DareCompleteHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare complete command execution
   * @param {Command} command - Command with dare_id and optional notes in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const dareId = command.metadata.dare_id;
      const notes = command.metadata.notes;

      if (!dareId) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const success = await this.dareService.completeDare(dareId, notes);

      if (!success) {
        return CommandResult.fail(new Error(`Failed to complete dare #${dareId}`));
      }

      return CommandResult.ok({
        message: `Dare #${dareId} marked as completed!`,
        dareId,
        notes: notes || null,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareCompleteHandler;
