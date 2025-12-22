const MiddlewarePipeline = require('../../../../src/app/bus/MiddlewarePipeline');

describe('MiddlewarePipeline', () => {
  describe('execute', () => {
    it('should execute single middleware', async () => {
      const middleware = {
        handle: jest.fn().mockImplementation((context, next) => next()),
      };

      const pipeline = new MiddlewarePipeline([middleware]);
      const handler = jest.fn().mockResolvedValue('result');
      const context = { test: 'data' };

      const result = await pipeline.execute(context, handler);

      expect(middleware.handle).toHaveBeenCalledWith(context, expect.any(Function));
      expect(handler).toHaveBeenCalledWith(context);
      expect(result).toBe('result');
    });

    it('should execute multiple middlewares in order', async () => {
      const execution = [];

      const middleware1 = {
        handle: jest.fn().mockImplementation((context, next) => {
          execution.push('middleware1-before');
          const result = next();
          execution.push('middleware1-after');
          return result;
        }),
      };

      const middleware2 = {
        handle: jest.fn().mockImplementation((context, next) => {
          execution.push('middleware2-before');
          const result = next();
          execution.push('middleware2-after');
          return result;
        }),
      };

      const pipeline = new MiddlewarePipeline([middleware1, middleware2]);
      const handler = jest.fn().mockImplementation(() => {
        execution.push('handler');
        return 'result';
      });

      await pipeline.execute({}, handler);

      expect(execution).toEqual([
        'middleware1-before',
        'middleware2-before',
        'handler',
        'middleware2-after',
        'middleware1-after',
      ]);
    });

    it('should execute handler when no middleware', async () => {
      const pipeline = new MiddlewarePipeline([]);
      const handler = jest.fn().mockResolvedValue('result');
      const context = { test: 'data' };

      const result = await pipeline.execute(context, handler);

      expect(handler).toHaveBeenCalledWith(context);
      expect(result).toBe('result');
    });

    it('should pass context through pipeline', async () => {
      const middleware = {
        handle: jest.fn().mockImplementation((context, next) => {
          context.modified = true;
          return next();
        }),
      };

      const pipeline = new MiddlewarePipeline([middleware]);
      const handler = jest.fn().mockResolvedValue('result');
      const context = { test: 'data' };

      await pipeline.execute(context, handler);

      expect(handler).toHaveBeenCalledWith({ test: 'data', modified: true });
    });

    it('should allow middleware to return without calling next', async () => {
      const middleware1 = {
        handle: jest.fn().mockImplementation(() => 'short-circuit'),
      };

      const middleware2 = {
        handle: jest.fn(),
      };

      const pipeline = new MiddlewarePipeline([middleware1, middleware2]);
      const handler = jest.fn();

      const result = await pipeline.execute({}, handler);

      expect(result).toBe('short-circuit');
      expect(middleware2.handle).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should throw error if next() called multiple times', async () => {
      const middleware = {
        handle: jest.fn().mockImplementation((context, next) => {
          next();
          return next(); // Call next twice
        }),
      };

      const pipeline = new MiddlewarePipeline([middleware]);
      const handler = jest.fn().mockResolvedValue('result');

      await expect(pipeline.execute({}, handler)).rejects.toThrow(
        'next() called multiple times',
      );
    });

    it('should handle middleware errors', async () => {
      const error = new Error('Middleware error');
      const middleware = {
        handle: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const pipeline = new MiddlewarePipeline([middleware]);
      const handler = jest.fn();

      await expect(pipeline.execute({}, handler)).rejects.toThrow(
        'Middleware error',
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support async middleware', async () => {
      const middleware = {
        handle: jest.fn().mockImplementation(async (context, next) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return next();
        }),
      };

      const pipeline = new MiddlewarePipeline([middleware]);
      const handler = jest.fn().mockResolvedValue('result');

      const result = await pipeline.execute({}, handler);

      expect(result).toBe('result');
      expect(middleware.handle).toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('should initialize with empty middleware array', () => {
      const pipeline = new MiddlewarePipeline([]);
      expect(pipeline.middlewares).toEqual([]);
    });

    it('should initialize with middlewares', () => {
      const mw1 = { handle: jest.fn() };
      const mw2 = { handle: jest.fn() };
      const pipeline = new MiddlewarePipeline([mw1, mw2]);
      expect(pipeline.middlewares).toEqual([mw1, mw2]);
    });

    it('should handle undefined middleware array', () => {
      const pipeline = new MiddlewarePipeline();
      expect(pipeline.middlewares).toEqual([]);
    });
  });
});
