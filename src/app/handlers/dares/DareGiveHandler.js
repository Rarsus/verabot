const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for giving a dare to a specific user
 * @class DareGiveHandler
 * @example
 * const handler = new DareGiveHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareGiveHandler {
  /**
   * Create a new DareGiveHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare give command execution
   * @param {Command} command - Command with user and optional random flag in metadata
   * @returns {Promise<CommandResult>} Assigned dare details
   */
  async handle(command) {
    try {
      const targetUser = command.metadata.user;
      const useRandom = command.metadata.random === true || command.metadata.random === 'true';
      const theme = command.metadata.theme;

      if (!targetUser) {
        return CommandResult.fail(new Error('Target user is required'));
      }

      let dare;

      if (useRandom) {
        // Get random existing dare
        dare = await this.dareService.getRandomDare({ theme });

        if (!dare) {
          // No existing dare, generate a new one
          const generated = await this.dareService.generateDareFromPerchance(
            theme || 'general',
            command.userId,
          );
          dare = generated;
        }
      } else {
        // Generate a fresh dare
        const generated = await this.dareService.generateDareFromPerchance(
          theme || 'general',
          command.userId,
        );
        dare = generated;
      }

      // Assign the dare to the user
      await this.dareService.assignDare(dare.id, targetUser);

      return CommandResult.ok({
        message: `Dare #${dare.id} assigned to <@${targetUser}>!`,
        dare: {
          id: dare.id,
          content: dare.content,
          theme: dare.theme,
          assigned_to: targetUser,
        },
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareGiveHandler;
