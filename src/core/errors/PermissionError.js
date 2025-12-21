const DomainError = require('./DomainError');

class PermissionError extends DomainError {
  constructor(message = 'Permission denied') {
    super(message, 'PERMISSION_DENIED');
  }
}

module.exports = PermissionError;
