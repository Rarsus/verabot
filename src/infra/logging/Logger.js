const pino = require('pino');

/**
 * Create a configured logger instance
 * Sets up Pino logger with environment-specific transport configuration
 * Uses pino-pretty for pretty-printed output in development mode
 * @param {Object} config - Application configuration object
 * @param {string} config.NODE_ENV - Environment name (development/production/test)
 * @param {string} config.LOG_LEVEL - Logging level (debug/info/warn/error)
 * @returns {pino.Logger} Configured Pino logger instance
 * @example
 * const logger = createLogger({ NODE_ENV: 'development', LOG_LEVEL: 'info' });
 * logger.info('Application started');
 * logger.error({ err }, 'Error occurred');
 */
function createLogger(config) {
  const isDev = config.NODE_ENV === 'development';
  return pino({
    level: config.LOG_LEVEL,
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined,
  });
}

module.exports = { createLogger };
