const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for getting a specific dare by ID
 * @class DareGetHandler
 * @example
 * const handler = new DareGetHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareGetHandler {
  /**
   * Create a new DareGetHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare get command execution
   * @param {Command} command - Command with dare_id in metadata
   * @returns {Promise<CommandResult>} Dare details
   */
  async handle(command) {
    try {
      const dareId = command.metadata.dare_id;

      if (!dareId) {
        return CommandResult.fail(new Error('Dare ID is required'));
      }

      const dare = await this.dareService.getDareById(dareId);

      if (!dare) {
        return CommandResult.fail(new Error(`Dare #${dareId} not found`));
      }

      return CommandResult.ok({
        dare,
        message: `Dare #${dare.id}`,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareGetHandler;
