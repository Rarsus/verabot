class RateLimitMiddleware {
  constructor(rateLimitService) {
    this.rateLimitService = rateLimitService;
  }

  async handle(context, next) {
    const { command, category } = context;
    await this.rateLimitService.tryConsume(command, category);
    return next();
  }
}

module.exports = RateLimitMiddleware;
