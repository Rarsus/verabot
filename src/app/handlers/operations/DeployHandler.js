const CommandResult = require('../../../core/commands/CommandResult');

class DeployHandler {
  constructor(logger) {
    this.logger = logger;
  }

  async handle(command) {
    const target = command.args[0] || 'production';
    this.logger.info({ target }, 'Simulating deployment');
    await new Promise(res => setTimeout(res, 1500));
    return CommandResult.ok({ message: `Deployment to ${target} completed successfully` });
  }
}

module.exports = DeployHandler;
