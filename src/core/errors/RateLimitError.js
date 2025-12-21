const DomainError = require('./DomainError');

class RateLimitError extends DomainError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT');
  }
}

module.exports = RateLimitError;
