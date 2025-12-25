const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for listing all dares with pagination
 * @class DareListHandler
 * @example
 * const handler = new DareListHandler(dareService);
 * const result = await handler.handle(command);
 */
class DareListHandler {
  /**
   * Create a new DareListHandler instance
   * @param {Object} dareService - Dare service with business logic methods
   */
  constructor(dareService) {
    /** @type {Object} */
    this.dareService = dareService;
  }

  /**
   * Handle dare list command execution
   * @param {Command} command - Command with optional page, status, theme in metadata
   * @returns {Promise<CommandResult>} Paginated list of dares
   */
  async handle(command) {
    try {
      const options = {
        page: command.metadata.page || 1,
        perPage: command.metadata.perPage || 20,
        status: command.metadata.status,
        theme: command.metadata.theme,
      };

      const result = await this.dareService.getAllDares(options);

      if (!result.dares || result.dares.length === 0) {
        return CommandResult.fail(new Error('No dares available'));
      }

      return CommandResult.ok({
        dares: result.dares,
        pagination: result.pagination,
        message: `Found ${result.pagination.total} dare${result.pagination.total !== 1 ? 's' : ''} (Page ${result.pagination.page} of ${result.pagination.totalPages})`,
      });
    } catch (error) {
      return CommandResult.fail(error);
    }
  }
}

module.exports = DareListHandler;
