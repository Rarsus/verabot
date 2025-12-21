const PermissionMiddleware = require('../../../src/app/middleware/PermissionMiddleware');
const PermissionError = require('../../../src/core/errors/PermissionError');

describe('PermissionMiddleware', () => {
  let middleware;
  let mockPermissionService;
  let mockNext;
  let mockContext;

  beforeEach(() => {
    mockPermissionService = {
      canExecute: jest.fn()
    };
    middleware = new PermissionMiddleware(mockPermissionService);
    mockNext = jest.fn().mockResolvedValue({ success: true });
    mockContext = {
      command: { name: 'test-command' },
      category: 'core'
    };
  });

  describe('handle - permission granted', () => {
    it('should call next when permission granted', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);

      await middleware.handle(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return result from next handler', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const expectedResult = { success: true, data: { id: 123 } };
      mockNext.mockResolvedValue(expectedResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(expectedResult);
    });

    it('should pass context to canExecute', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);

      await middleware.handle(mockContext, mockNext);

      expect(mockPermissionService.canExecute).toHaveBeenCalledWith(mockContext.command, mockContext.category);
    });

    it('should execute middleware chain when allowed', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const callOrder = [];
      mockNext.mockImplementation(() => {
        callOrder.push('next');
        return Promise.resolve({ success: true });
      });

      callOrder.push('middleware');
      await middleware.handle(mockContext, mockNext);
      callOrder.push('after');

      expect(callOrder).toEqual(['middleware', 'next', 'after']);
    });
  });

  describe('handle - permission denied', () => {
    it('should throw PermissionError when denied', async () => {
      mockPermissionService.canExecute.mockResolvedValue(false);

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(PermissionError);
    });

    it('should not call next when permission denied', async () => {
      mockPermissionService.canExecute.mockResolvedValue(false);

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (_err) {
        // Expected
      }

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error before calling next handler', async () => {
      mockPermissionService.canExecute.mockResolvedValue(false);
      let nextCalled = false;
      mockNext.mockImplementation(() => {
        nextCalled = true;
        return Promise.resolve({ success: true });
      });

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow();
      expect(nextCalled).toBe(false);
    });
  });

  describe('handle - context variations', () => {
    it('should handle different command types', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const differentContext = {
        command: { name: 'admin-command' },
        category: 'admin'
      };

      await middleware.handle(differentContext, mockNext);

      expect(mockPermissionService.canExecute).toHaveBeenCalledWith(
        differentContext.command,
        differentContext.category
      );
    });

    it('should handle messaging category', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const messagingContext = {
        command: { name: 'say' },
        category: 'messaging'
      };

      await middleware.handle(messagingContext, mockNext);

      expect(mockPermissionService.canExecute).toHaveBeenCalledWith(
        messagingContext.command,
        'messaging'
      );
    });

    it('should handle operations category', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const opsContext = {
        command: { name: 'deploy' },
        category: 'operations'
      };

      await middleware.handle(opsContext, mockNext);

      expect(mockPermissionService.canExecute).toHaveBeenCalledWith(opsContext.command, 'operations');
    });
  });

  describe('handle - error conditions', () => {
    it('should propagate service errors', async () => {
      const serviceError = new Error('Service unavailable');
      mockPermissionService.canExecute.mockRejectedValue(serviceError);

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('Service unavailable');
    });

    it('should not catch unexpected errors', async () => {
      mockPermissionService.canExecute.mockRejectedValue(new ReferenceError('Undefined variable'));

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(ReferenceError);
    });

    it('should handle next handler errors', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      mockNext.mockRejectedValue(new Error('Handler failed'));

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('Handler failed');
    });
  });

  describe('integration scenarios', () => {
    it('should work in middleware chain with other handlers', async () => {
      mockPermissionService.canExecute.mockResolvedValue(true);
      const executedSteps = [];

      mockNext.mockImplementation(async () => {
        executedSteps.push('next-handler');
        return { success: true, steps: executedSteps };
      });

      const result = await middleware.handle(mockContext, mockNext);

      expect(result.success).toBe(true);
      expect(result.steps).toContain('next-handler');
    });

    it('should prevent unauthorized access early', async () => {
      mockPermissionService.canExecute.mockResolvedValue(false);
      const executedSteps = [];

      mockNext.mockImplementation(async () => {
        executedSteps.push('should-not-execute');
        return { success: true };
      });

      try {
        await middleware.handle(mockContext, mockNext);
      } catch (_err) {
        // Expected
      }

      expect(executedSteps.length).toBe(0);
    });
  });
});
