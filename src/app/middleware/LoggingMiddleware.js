/**
 * Middleware for logging command execution and metrics collection
 * @class LoggingMiddleware
 * @example
 * const logging = new LoggingMiddleware(logger, metrics);
 * pipeline.use(logging);
 */
class LoggingMiddleware {
  /**
   * Create a new LoggingMiddleware instance
   * @param {Object} logger - Logger instance with info/error methods
   * @param {Object} [metrics] - Optional metrics instance with command/error counters
   */
  constructor(logger, metrics) {
    /** @type {Object} */
    this.logger = logger;
    /** @type {Object|undefined} */
    this.metrics = metrics;
  }

  /**
   * Handle middleware execution with logging
   * @param {CommandContext} context - The command context
   * @param {Function} next - Next middleware handler
   * @returns {Promise<CommandResult>} Command execution result
   */
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
          code: err.code || 'ERROR',
        });
      }
      throw err;
    }
  }
}

module.exports = LoggingMiddleware;
