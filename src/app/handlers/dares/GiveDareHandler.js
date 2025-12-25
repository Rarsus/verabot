const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for giving a dare to a Discord user
 * @class GiveDareHandler
 * @example
 * const handler = new GiveDareHandler(dareService);
 * const result = await handler.handle(command);
 */
class GiveDareHandler {
  /**
   * Create a new GiveDareHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle give dare command execution
   * @param {Command} command - Command with user ID and optional random flag in metadata
   * @returns {Promise<CommandResult>} Success message with dare assigned
   */
  async handle(command) {
    try {
      const targetUserId = command.metadata.user;
      const useRandom = command.metadata.random === true || command.metadata.random === 'true';
      const dareId = command.metadata.dare_id;

      if (!targetUserId) {
        return CommandResult.fail(new Error('Target user is required'));
      }

      let dare;

      if (useRandom || !dareId) {
        // Get a random active dare
        dare = await this.dareService.getRandomDare({ status: 'active' });

        if (!dare) {
          return CommandResult.fail(new Error('No active dares available'));
        }

        // Assign it to the user
        await this.dareService.assignDare(dare.id, targetUserId);
      } else {
        // Get specific dare and assign
        dare = await this.dareService.getDareById(dareId);

        if (!dare) {
          return CommandResult.fail(new Error(`Dare #${dareId} not found`));
        }

        await this.dareService.assignDare(dare.id, targetUserId);
      }

      return CommandResult.ok({
        message: `Dare #${dare.id} assigned to user successfully!`,
        dareId: dare.id,
        content: dare.content,
        assignedTo: targetUserId,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = GiveDareHandler;
