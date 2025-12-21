/**
 * Middleware for logging command execution to audit trail
 * @class AuditMiddleware
 * @example
 * const audit = new AuditMiddleware(auditRepo);
 * pipeline.use(audit);
 */
class AuditMiddleware {
  /**
   * Create a new AuditMiddleware instance
   * @param {Object} auditRepo - Repository for storing audit logs
   */
  constructor(auditRepo) {
    /** @type {Object} */
    this.auditRepo = auditRepo;
  }

  /**
   * Handle middleware execution with audit logging
   * @param {CommandContext} context - The command context
   * @param {Function} next - Next middleware handler
   * @returns {Promise<CommandResult>} Command execution result
   */
  async handle(context, next) {
    const { command } = context;
    const result = await next();
    await this.auditRepo.log(command, result);
    return result;
  }
}

module.exports = AuditMiddleware;
