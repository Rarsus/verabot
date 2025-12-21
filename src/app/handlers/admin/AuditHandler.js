const CommandResult = require('../../../core/commands/CommandResult');

class AuditHandler {
  constructor(repos) {
    this.repos = repos;
  }

  async handle(command) {
    const limit = Number(command.args[0]) || 20;
    const rows = await this.repos.permissionRepo.listAudit(limit);

    return CommandResult.ok({
      type: 'audit',
      entries: rows
    });
  }
}

module.exports = AuditHandler;
