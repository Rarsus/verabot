const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for help command - provides command documentation and listings
 * @class HelpHandler
 * @example
 * const handler = new HelpHandler(helpService);
 * const result = await handler.handle(command);
 */
class HelpHandler {
  /**
   * Create a new HelpHandler instance
   * @param {HelpService} helpService - Service for help content
   */
  constructor(helpService) {
    /** @type {HelpService} */
    this.helpService = helpService;
  }

  /**
   * Handle help command execution
   * @param {Command} command - The command with args [categoryOrCommand, pageRaw]
   * @returns {Promise<CommandResult>} Help content or command list
   * @example
   * // Get help for a specific command
   * const result = await handler.handle({ args: ['ping'] });
   *
   * // Get commands by category
   * const result = await handler.handle({ args: ['core'] });
   *
   * // Get paginated command list
   * const result = await handler.handle({ args: [null, 2] });
   */
  async handle(command) {
    const [categoryOrCommand, pageRaw] = command.args;

    if (categoryOrCommand) {
      const meta = this.helpService.getCommandHelp(categoryOrCommand);
      if (meta) {
        return CommandResult.ok({
          type: 'command',
          name: categoryOrCommand,
          category: meta.category,
          description: meta.description,
          usage: meta.usage,
          examples: meta.examples
        });
      }
    }

    const category = categoryOrCommand && isNaN(categoryOrCommand)
      ? categoryOrCommand
      : null;

    const page = categoryOrCommand && !isNaN(categoryOrCommand)
      ? Number(categoryOrCommand)
      : pageRaw
        ? Number(pageRaw)
        : 1;

    const commands = this.helpService.getCommandsByCategory(category);
    const paginated = this.helpService.paginate(commands, page);

    return CommandResult.ok({
      type: 'list',
      category,
      ...paginated
    });
  }
}

module.exports = HelpHandler;

