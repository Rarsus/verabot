class AuditMiddleware {
  constructor(auditRepo) {
    this.auditRepo = auditRepo;
  }

  async handle(context, next) {
    const { command } = context;
    const result = await next();
    await this.auditRepo.log(command, result);
    return result;
  }
}

module.exports = AuditMiddleware;
