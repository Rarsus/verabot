const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for listing all dares
 * @class ListDaresHandler
 * @example
 * const handler = new ListDaresHandler(dareService);
 * const result = await handler.handle(command);
 */
class ListDaresHandler {
  /**
   * Create a new ListDaresHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle list dares command execution
   * @param {Command} command - Command with optional status filter in metadata
   * @returns {Promise<CommandResult>} Array of all dares
   */
  async handle(command) {
    try {
      const filters = {};
      if (command.metadata && command.metadata.status) {
        filters.status = command.metadata.status;
      }

      const dares = await this.dareService.getAllDares(filters);

      if (!dares || dares.length === 0) {
        return CommandResult.fail(new Error('No dares available'));
      }

      const count = dares.length;
      return CommandResult.ok({
        dares,
        count,
        message: `Found ${count} dare${count !== 1 ? 's' : ''}`,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = ListDaresHandler;
