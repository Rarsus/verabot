const DomainError = require('./DomainError');

/**
 * Error thrown when a rate limit is exceeded
 * @class RateLimitError
 * @extends DomainError
 * @example
 * throw new RateLimitError('Too many requests. Try again in 5 minutes');
 */
class RateLimitError extends DomainError {
  /**
   * Create a new RateLimitError instance
   * @param {string} [message='Rate limit exceeded'] - Error message
   */
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT');
  }
}

module.exports = RateLimitError;
