const PermissionError = require('../../core/errors/PermissionError');

class PermissionMiddleware {
  constructor(permissionService) {
    this.permissionService = permissionService;
  }

  async handle(context, next) {
    const { command, category } = context;
    const ok = await this.permissionService.canExecute(command, category);
    if (!ok) throw new PermissionError();
    return next();
  }
}

module.exports = PermissionMiddleware;
