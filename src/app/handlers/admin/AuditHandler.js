const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for audit command - displays audit log entries
 * @class AuditHandler
 * @example
 * const handler = new AuditHandler(repos);
 * const result = await handler.handle(command);
 */
class AuditHandler {
  /**
   * Create a new AuditHandler instance
   * @param {Object} repos - Repository container with permissionRepo
   */
  constructor(repos) {
    /** @type {Object} */
    this.repos = repos;
  }

  /**
   * Handle audit command execution
   * @param {Command} command - Command with args [limit]
   * @returns {Promise<CommandResult>} Audit log entries
   */
  async handle(command) {
    const limit = Number(command.args[0]) || 20;
    const rows = await this.repos.permissionRepo.listAudit(limit);

    return CommandResult.ok({
      type: 'audit',
      entries: rows,
    });
  }
}

module.exports = AuditHandler;
