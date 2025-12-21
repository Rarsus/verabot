class LoggingMiddleware {
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
  }

  async handle(context, next) {
    const { command, category } = context;
    this.logger.info({ cmd: command.name, src: command.source, category }, 'Executing command');
    try {
      const result = await next();
      this.logger.info({ cmd: command.name, success: result.success }, 'Command complete');
      if (this.metrics?.commandCounter) {
        this.metrics.commandCounter.inc({ command: command.name, source: command.source });
      }
      return result;
    } catch (err) {
      this.logger.error({ cmd: command.name, err }, 'Command failed');
      if (this.metrics?.errorCounter) {
        this.metrics.errorCounter.inc({
          command: command.name,
          source: command.source,
          code: err.code || 'ERROR'
        });
      }
      throw err;
    }
  }
}

module.exports = LoggingMiddleware;
