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
   * @param {Command} command - Command with optional status, theme, page filters in metadata
   * @returns {Promise<CommandResult>} Array of dares with pagination info
   */
  async handle(command) {
    try {
      const filters = {};
      if (command.metadata?.status) {
        filters.status = command.metadata.status;
      }
      if (command.metadata?.theme) {
        filters.theme = command.metadata.theme;
      }
      if (command.metadata?.page) {
        filters.page = parseInt(command.metadata.page, 10);
      }
      filters.perPage = 10; // Default per page

      const dares = await this.dareService.getAllDares(filters);
      const totalCount = await this.dareService.getDareCount({
        status: filters.status,
        theme: filters.theme,
      });

      if (!dares || dares.length === 0) {
        return CommandResult.fail(new Error('No dares available'));
      }

      const page = filters.page || 1;
      const perPage = filters.perPage;
      const totalPages = Math.ceil(totalCount / perPage);

      return CommandResult.ok({
        dares,
        count: dares.length,
        totalCount,
        page,
        perPage,
        totalPages,
        message: `Found ${dares.length} dare${dares.length !== 1 ? 's' : ''} (page ${page}/${totalPages}, total ${totalCount})`,
      });
    } catch (err) {
      return CommandResult.fail(err);
    }
  }
}

module.exports = ListDaresHandler;
