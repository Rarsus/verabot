const pino = require('pino');

function createLogger(config) {
  const isDev = config.NODE_ENV === 'development';
  return pino({
    level: config.LOG_LEVEL,
    transport: isDev
      ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' }
      }
      : undefined
  });
}

module.exports = { createLogger };
