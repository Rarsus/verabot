const DomainError = require('./DomainError');

/**
 * Error thrown when a command lacks required permissions
 * @class PermissionError
 * @extends DomainError
 * @example
 * throw new PermissionError('Admin role required');
 */
class PermissionError extends DomainError {
  /**
   * Create a new PermissionError instance
   * @param {string} [message='Permission denied'] - Error message
   */
  constructor(message = 'Permission denied') {
    super(message, 'PERMISSION_DENIED');
  }
}

module.exports = PermissionError;

