const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for marking a dare as completed
 * @class CompleteDareHandler
 * @example
 * const handler = new CompleteDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class CompleteDareHandler {
  /**
   * Create a new CompleteDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle complete dare command execution
   * @param {Command} command - Command with dare ID and optional notes in metadata
   * @returns {Promise<CommandResult>} Success message
   */
  async handle(command) {
    try {
      const id = command.metadata.id;
      const notes = command.metadata.notes;
      const userId = command.userId;

      if (!id) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      await this.dareService.completeDare(id, userId, notes);

      return CommandResult.ok({
        message: `Dare #${id} marked as completed!`,
        dareId: id,
        completedBy: userId,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = CompleteDareHandler;
