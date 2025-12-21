/**
 * Base error class for domain-specific errors
 * @class DomainError
 * @extends Error
 * @example
 * throw new DomainError('Invalid operation', 'INVALID_OP');
 */
class DomainError extends Error {
  /**
   * Create a new DomainError instance
   * @param {string} message - Error message
   * @param {string} [code='DOMAIN_ERROR'] - Error code for categorization
   */
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message);
    /** @type {string} */
    this.code = code;
  }
}

module.exports = DomainError;

