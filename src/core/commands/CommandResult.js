class CommandResult {
  constructor({ success, data = null, error = null }) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static ok(data) {
    return new CommandResult({ success: true, data });
  }

  static fail(error) {
    return new CommandResult({ success: false, error });
  }
}

module.exports = CommandResult;
