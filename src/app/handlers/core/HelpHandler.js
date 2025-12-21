const CommandResult = require('../../../core/commands/CommandResult');

class HelpHandler {
  constructor(helpService) {
    this.helpService = helpService;
  }

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
