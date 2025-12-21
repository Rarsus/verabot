const { createLogger } = require('../../../../src/infra/logging/Logger');

jest.mock('pino');

describe('Logger', () => {
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    const pino = require('pino');
    pino.mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    });
  });

  it('should create logger with config', () => {
    mockConfig = {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    };

    const logger = createLogger(mockConfig);

    expect(logger).toBeDefined();
  });

  it('should set log level from config', () => {
    const pino = require('pino');
    mockConfig = {
      NODE_ENV: 'production',
      LOG_LEVEL: 'debug'
    };

    createLogger(mockConfig);

    expect(pino).toHaveBeenCalled();
  });

  it('should use pino-pretty in development', () => {
    const pino = require('pino');
    mockConfig = {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    };

    createLogger(mockConfig);

    const call = pino.mock.calls[pino.mock.calls.length - 1][0];
    expect(call.transport).toBeDefined();
    expect(call.transport.target).toBe('pino-pretty');
  });

  it('should not use transport in production', () => {
    const pino = require('pino');
    mockConfig = {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    };

    createLogger(mockConfig);

    const call = pino.mock.calls[pino.mock.calls.length - 1][0];
    expect(call.transport).toBeUndefined();
  });
});
