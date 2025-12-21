const RateLimitMiddleware = require('../../../src/app/middleware/RateLimitMiddleware');
const RateLimitError = require('../../../src/core/errors/RateLimitError');

describe('RateLimitMiddleware', () => {
  let middleware;
  let mockRateLimitService;
  let mockNext;
  let mockContext;

  beforeEach(() => {
    mockRateLimitService = {
      tryConsume: jest.fn().mockResolvedValue(true)
    };
    middleware = new RateLimitMiddleware(mockRateLimitService);
    mockNext = jest.fn().mockResolvedValue({ success: true });
    mockContext = {
      command: { name: 'test-command' },
      category: 'core'
    };
  });

  describe('handle - rate limit allowed', () => {
    it('should call tryConsume with command and category', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockRateLimitService.tryConsume).toHaveBeenCalledWith(
        mockContext.command,
        mockContext.category
      );
    });

    it('should call next handler when rate limit allows', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return result from next handler', async () => {
      const expectedResult = { success: true, data: 'test-data' };
      mockNext.mockResolvedValue(expectedResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(expectedResult);
    });

    it('should not interfere with result', async () => {
      const complexResult = {
        success: true,
        data: { id: 123, message: 'Success', nested: { key: 'value' } }
      };
      mockNext.mockResolvedValue(complexResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(complexResult);
      expect(result.data.nested.key).toBe('value');
    });

    it('should execute before next handler', async () => {
      const executionOrder = [];

      mockRateLimitService.tryConsume.mockImplementation(() => {
        executionOrder.push('rate-limit-check');
        return Promise.resolve(true);
      });

      mockNext.mockImplementation(() => {
        executionOrder.push('next-handler');
        return Promise.resolve({ success: true });
      });

      await middleware.handle(mockContext, mockNext);

      expect(executionOrder).toEqual(['rate-limit-check', 'next-handler']);
    });
  });

  describe('handle - rate limit exceeded', () => {
    it('should throw RateLimitError when tryConsume fails', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(new RateLimitError());

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(RateLimitError);
    });

    it('should not call next when rate limited', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(new RateLimitError());

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (err) {
        // Expected
      }

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should prevent handler execution on rate limit', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(new RateLimitError());
      let handlerExecuted = false;

      mockNext.mockImplementation(() => {
        handlerExecuted = true;
        return Promise.resolve({ success: true });
      });

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (err) {
        expect(handlerExecuted).toBe(false);
      }
    });
  });

  describe('handle - different categories', () => {
    it('should pass core category correctly', async () => {
      const coreContext = {
        command: { name: 'ping' },
        category: 'core'
      };

      await middleware.handle(coreContext, mockNext);

      expect(mockRateLimitService.tryConsume).toHaveBeenCalledWith(
        coreContext.command,
        'core'
      );
    });

    it('should pass messaging category correctly', async () => {
      const messagingContext = {
        command: { name: 'say' },
        category: 'messaging'
      };

      await middleware.handle(messagingContext, mockNext);

      expect(mockRateLimitService.tryConsume).toHaveBeenCalledWith(
        messagingContext.command,
        'messaging'
      );
    });

    it('should pass operations category correctly', async () => {
      const opsContext = {
        command: { name: 'deploy' },
        category: 'operations'
      };

      await middleware.handle(opsContext, mockNext);

      expect(mockRateLimitService.tryConsume).toHaveBeenCalledWith(
        opsContext.command,
        'operations'
      );
    });

    it('should pass admin category correctly', async () => {
      const adminContext = {
        command: { name: 'allow' },
        category: 'admin'
      };

      await middleware.handle(adminContext, mockNext);

      expect(mockRateLimitService.tryConsume).toHaveBeenCalledWith(
        adminContext.command,
        'admin'
      );
    });
  });

  describe('handle - error handling', () => {
    it('should propagate rate limit errors', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(new RateLimitError());

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(RateLimitError);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Service unavailable');
      mockRateLimitService.tryConsume.mockRejectedValue(serviceError);

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should propagate next handler errors', async () => {
      mockRateLimitService.tryConsume.mockResolvedValue(true);
      mockNext.mockRejectedValue(new Error('Handler failed'));

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('Handler failed');
    });

    it('should not catch unexpected errors', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(
        new ReferenceError('Undefined variable')
      );

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(ReferenceError);
    });
  });

  describe('integration scenarios', () => {
    it('should work in middleware chain', async () => {
      const executedSteps = [];

      mockRateLimitService.tryConsume.mockImplementation(() => {
        executedSteps.push('rate-limit-check');
        return Promise.resolve(true);
      });

      mockNext.mockImplementation(async () => {
        executedSteps.push('handler');
        return { success: true };
      });

      const result = await middleware.handle(mockContext, mockNext);

      expect(executedSteps).toEqual(['rate-limit-check', 'handler']);
      expect(result.success).toBe(true);
    });

    it('should prevent slow operations when rate limited', async () => {
      mockRateLimitService.tryConsume.mockRejectedValue(new RateLimitError());
      const slowHandler = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      });

      try {
        await middleware.handle(mockContext, slowHandler);
      } catch (err) {
        // Expected
      }

      expect(slowHandler).not.toHaveBeenCalled();
    });

    it('should allow burst of fast operations within limits', async () => {
      const contexts = [
        { command: { name: 'cmd1' }, category: 'core' },
        { command: { name: 'cmd2' }, category: 'core' },
        { command: { name: 'cmd3' }, category: 'core' }
      ];

      mockRateLimitService.tryConsume.mockResolvedValue(true);
      mockNext.mockResolvedValue({ success: true });

      for (const ctx of contexts) {
        const result = await middleware.handle(ctx, mockNext);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('constructor and initialization', () => {
    it('should initialize with rate limit service', () => {
      expect(middleware.rateLimitService).toBe(mockRateLimitService);
    });

    it('should have service available for rate limiting', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(middleware.rateLimitService.tryConsume).toHaveBeenCalled();
    });
  });
});
