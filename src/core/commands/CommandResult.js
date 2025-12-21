/**
 * Represents the result of a command execution
 * @class CommandResult
 * @example
 * const result = CommandResult.ok({ message: 'Success' });
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
class CommandResult {
  /**
   * Create a new CommandResult instance
   * @param {Object} options - Result configuration
   * @param {boolean} options.success - Whether the command succeeded
   * @param {*} [options.data=null] - Result data (on success)
   * @param {Error|string} [options.error=null] - Error information (on failure)
   */
  constructor({ success, data = null, error = null }) {
    /** @type {boolean} */
    this.success = success;
    /** @type {*} */
    this.data = data;
    /** @type {Error|string|null} */
    this.error = error;
  }

  /**
   * Create a successful result
   * @param {*} data - Result data
   * @returns {CommandResult} Successful result
   * @example
   * return CommandResult.ok({ count: 42 });
   */
  static ok(data) {
    return new CommandResult({ success: true, data });
  }

  /**
   * Create a failed result
   * @param {Error|string} error - Error details
   * @returns {CommandResult} Failed result
   * @example
   * return CommandResult.fail(new Error('Invalid argument'));
   */
  static fail(error) {
    return new CommandResult({ success: false, error });
  }
}

module.exports = CommandResult;

