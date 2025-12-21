const PermissionError = require('../../core/errors/PermissionError');

/**
 * Middleware for enforcing command permissions
 * @class PermissionMiddleware
 * @example
 * const permission = new PermissionMiddleware(permissionService);
 * pipeline.use(permission);
 */
class PermissionMiddleware {
  /**
   * Create a new PermissionMiddleware instance
   * @param {PermissionService} permissionService - Permission validation service
   */
  constructor(permissionService) {
    /** @type {PermissionService} */
    this.permissionService = permissionService;
  }

  /**
   * Handle middleware execution with permission checks
   * @param {CommandContext} context - The command context
   * @param {Function} next - Next middleware handler
   * @returns {Promise<CommandResult>} Command execution result
   * @throws {PermissionError} If command execution is not allowed
   */
  async handle(context, next) {
    const { command, category } = context;
    const ok = await this.permissionService.canExecute(command, category);
    if (!ok) throw new PermissionError();
    return next();
  }
}

module.exports = PermissionMiddleware;
