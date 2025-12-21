/**
 * @typedef {Object} Middleware
 * @property {Function} handle - The middleware handler function
 */

/**
 * Pipeline for executing middleware in sequence followed by a final handler
 * @class MiddlewarePipeline
 * @example
 * const pipeline = new MiddlewarePipeline([logMiddleware, authMiddleware]);
 * const result = await pipeline.execute(context, finalHandler);
 */
class MiddlewarePipeline {
  /**
   * Create a new MiddlewarePipeline instance
   * @param {Middleware[]} [middlewares=[]] - Array of middleware to execute in order
   */
  constructor(middlewares) {
    /** @type {Middleware[]} */
    this.middlewares = middlewares || [];
  }

  /**
   * Execute the middleware pipeline followed by the final handler
   * @param {Object} context - Context object passed through pipeline
   * @param {Function} handler - Final handler to execute after all middleware
   * @returns {Promise<*>} The result from the handler
   * @throws {Error} If next() is called multiple times in same middleware
   * @example
   * const result = await pipeline.execute({ command }, handler);
   */
  async execute(context, handler) {
    let index = -1;
    const run = async (i) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const mw = this.middlewares[i];
      if (mw) return mw.handle(context, () => run(i + 1));
      return handler(context);
    };
    return run(0);
  }
}

module.exports = MiddlewarePipeline;
