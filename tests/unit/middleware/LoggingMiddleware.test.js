const LoggingMiddleware = require('../../../src/app/middleware/LoggingMiddleware');

describe('LoggingMiddleware', () => {
  let middleware;
  let mockLogger;
  let mockMetrics;
  let mockContext;
  let mockNext;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockMetrics = {
      commandCounter: {
        inc: jest.fn(),
      },
      errorCounter: {
        inc: jest.fn(),
      },
    };

    middleware = new LoggingMiddleware(mockLogger, mockMetrics);

    mockContext = {
      command: { name: 'ping', source: 'test' },
      category: 'core',
    };

    mockNext = jest.fn().mockResolvedValue({ success: true, data: {} });
  });

  describe('handle', () => {
    it('should log command execution', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { cmd: 'ping', src: 'test', category: 'core' },
        'Executing command',
      );
    });

    it('should call next handler', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log successful command completion', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { cmd: 'ping', success: true },
        'Command complete',
      );
    });

    it('should increment command counter on success', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockMetrics.commandCounter.inc).toHaveBeenCalledWith({
        command: 'ping',
        source: 'test',
      });
    });

    it('should return handler result', async () => {
      const expectedResult = { success: true, data: { message: 'pong' } };
      mockNext.mockResolvedValue(expectedResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(expectedResult);
    });

    it('should handle handler errors', async () => {
      const error = new Error('Handler failed');
      error.code = 'HANDLER_ERROR';
      mockNext.mockRejectedValue(error);

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('Handler failed');
    });

    it('should log errors', async () => {
      const error = new Error('Handler failed');
      mockNext.mockRejectedValue(error);

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (e) {
        // Expected
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ cmd: 'ping', err: error }),
        'Command failed',
      );
    });

    it('should increment error counter on failure', async () => {
      const error = new Error('Handler failed');
      error.code = 'CUSTOM_ERROR';
      mockNext.mockRejectedValue(error);

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (e) {
        // Expected
      }

      expect(mockMetrics.errorCounter.inc).toHaveBeenCalledWith({
        command: 'ping',
        source: 'test',
        code: 'CUSTOM_ERROR',
      });
    });

    it('should use default error code if not provided', async () => {
      const error = new Error('Handler failed');
      mockNext.mockRejectedValue(error);

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (e) {
        // Expected
      }

      expect(mockMetrics.errorCounter.inc).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ERROR' }),
      );
    });
  });

  describe('with optional metrics', () => {
    it('should handle missing metrics gracefully', async () => {
      const middlewareNoMetrics = new LoggingMiddleware(mockLogger, null);

      const result = await middlewareNoMetrics.handle(mockContext, mockNext);

      expect(result).toEqual({ success: true, data: {} });
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
