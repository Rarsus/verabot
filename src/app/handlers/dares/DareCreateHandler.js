const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for creating new dares using Perchance AI generation
 * @class DareCreateHandler
 * @example
 * const handler = new DareCreateHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareCreateHandler {
  /**
   * Create a new DareCreateHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare create command execution
   * @param {Command} command - Command with optional theme in metadata
   * @returns {Promise<CommandResult>} Success message with dare details
   */
  async handle(command) {
    try {
      const theme = command.metadata.theme || 'general';
      const createdBy = command.userId;

      const dare = await this.dareService.generateDareFromPerchance(theme, createdBy);

      return CommandResult.ok({
        message: `Dare #${dare.id} created successfully!`,
        dare,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareCreateHandler;
