const AuditMiddleware = require('../../../src/app/middleware/AuditMiddleware');

describe('AuditMiddleware', () => {
  let middleware;
  let mockAuditRepo;
  let mockNext;
  let mockContext;

  beforeEach(() => {
    mockAuditRepo = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    middleware = new AuditMiddleware(mockAuditRepo);
    mockNext = jest.fn().mockResolvedValue({ success: true, data: {} });
    mockContext = {
      command: { name: 'test-command', args: ['arg1'] },
    };
  });

  describe('handle - audit logging', () => {
    it('should call next handler', async () => {
      await middleware.handle(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log command after execution', async () => {
      const result = { success: true, data: { id: 123 } };
      mockNext.mockResolvedValue(result);

      await middleware.handle(mockContext, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalled();
    });

    it('should pass command to audit log', async () => {
      mockNext.mockResolvedValue({ success: true });

      await middleware.handle(mockContext, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(mockContext.command, expect.any(Object));
    });

    it('should pass result to audit log', async () => {
      const expectedResult = { success: true, data: { id: 123 } };
      mockNext.mockResolvedValue(expectedResult);

      await middleware.handle(mockContext, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(mockContext.command, expectedResult);
    });

    it('should return result from next handler', async () => {
      const expectedResult = { success: true, data: 'test-data' };
      mockNext.mockResolvedValue(expectedResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(expectedResult);
    });

    it('should execute in correct order: next -> log', async () => {
      const callOrder = [];

      mockNext.mockImplementation(() => {
        callOrder.push('next');
        return Promise.resolve({ success: true });
      });

      mockAuditRepo.log.mockImplementation(() => {
        callOrder.push('log');
        return Promise.resolve();
      });

      await middleware.handle(mockContext, mockNext);

      expect(callOrder).toEqual(['next', 'log']);
    });
  });

  describe('handle - failure cases', () => {
    it('should log failed results', async () => {
      const failureResult = { success: false, error: 'Command failed' };
      mockNext.mockResolvedValue(failureResult);

      await middleware.handle(mockContext, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(mockContext.command, failureResult);
    });

    it('should still log when next handler throws', async () => {
      const error = new Error('Handler error');
      mockNext.mockRejectedValue(error);

      await expect(middleware.handle(mockContext, mockNext)).rejects.toEqual(error);

      // Audit log should not be called if handler throws
      expect(mockAuditRepo.log).not.toHaveBeenCalled();
    });

    it('should propagate errors from next handler', async () => {
      mockNext.mockRejectedValue(new Error('Next handler failed'));

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('Next handler failed');
    });
  });

  describe('handle - context variations', () => {
    it('should log different command types', async () => {
      mockNext.mockResolvedValue({ success: true });
      const adminCommand = {
        command: { name: 'admin-cmd', args: [], user: 'admin' },
      };

      await middleware.handle(adminCommand, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(adminCommand.command, expect.any(Object));
    });

    it('should log commands with complex args', async () => {
      mockNext.mockResolvedValue({ success: true });
      const complexCommand = {
        command: {
          name: 'complex',
          args: ['arg1', 'arg2', 'arg3'],
          metadata: { user: 'user1', channel: 'general' },
        },
      };

      await middleware.handle(complexCommand, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(complexCommand.command, expect.any(Object));
    });

    it('should handle empty commands', async () => {
      mockNext.mockResolvedValue({ success: true });
      const emptyContext = {
        command: { name: '', args: [] },
      };

      await middleware.handle(emptyContext, mockNext);

      expect(mockAuditRepo.log).toHaveBeenCalledWith(emptyContext.command, expect.any(Object));
    });
  });

  describe('handle - audit repo errors', () => {
    it('should propagate audit log errors', async () => {
      const auditError = new Error('Audit system failure');
      mockAuditRepo.log.mockRejectedValue(auditError);
      mockNext.mockResolvedValue({ success: true });

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow(
        'Audit system failure'
      );
    });

    it('should still propagate errors even with successful handler', async () => {
      mockNext.mockResolvedValue({ success: true });
      mockAuditRepo.log.mockRejectedValue(new Error('DB error'));

      await expect(middleware.handle(mockContext, mockNext)).rejects.toThrow('DB error');
    });
  });

  describe('integration scenarios', () => {
    it('should work in full middleware chain', async () => {
      const execution = [];

      mockNext.mockImplementation(async () => {
        execution.push('handler-executed');
        return { success: true, data: 'result' };
      });

      mockAuditRepo.log.mockImplementation(async () => {
        execution.push('audit-logged');
      });

      const result = await middleware.handle(mockContext, mockNext);

      expect(execution).toEqual(['handler-executed', 'audit-logged']);
      expect(result.success).toBe(true);
    });

    it('should not interfere with result data', async () => {
      const originalResult = {
        success: true,
        data: { id: 123, message: 'Success', nested: { value: 'test' } },
      };
      mockNext.mockResolvedValue(originalResult);

      const result = await middleware.handle(mockContext, mockNext);

      expect(result).toEqual(originalResult);
      expect(result.data.id).toBe(123);
      expect(result.data.nested.value).toBe('test');
    });
  });

  describe('constructor and initialization', () => {
    it('should initialize with audit repo', () => {
      expect(middleware.auditRepo).toBe(mockAuditRepo);
    });

    it('should have audit repo available for logging', async () => {
      mockNext.mockResolvedValue({ success: true });

      await middleware.handle(mockContext, mockNext);

      expect(middleware.auditRepo.log).toHaveBeenCalled();
    });
  });
});
