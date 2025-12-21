/**
 * Middleware for enforcing rate limits on command execution
 * @class RateLimitMiddleware
 * @example
 * const rateLimit = new RateLimitMiddleware(rateLimitService);
 * pipeline.use(rateLimit);
 */
class RateLimitMiddleware {
  /**
   * Create a new RateLimitMiddleware instance
   * @param {RateLimitService} rateLimitService - Rate limit enforcement service
   */
  constructor(rateLimitService) {
    /** @type {RateLimitService} */
    this.rateLimitService = rateLimitService;
  }

  /**
   * Handle middleware execution with rate limiting
   * @param {CommandContext} context - The command context
   * @param {Function} next - Next middleware handler
   * @returns {Promise<CommandResult>} Command execution result
   * @throws {RateLimitError} If rate limit is exceeded
   */
  async handle(context, next) {
    const { command, category } = context;
    await this.rateLimitService.tryConsume(command, category);
    return next();
  }
}

module.exports = RateLimitMiddleware;
