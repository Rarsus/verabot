const CommandResult = require('../../../core/commands/CommandResult');

/**
 * Handler for allowed command - lists all allowed commands with pagination
 * @class AllowedHandler
 * @example
 * const handler = new AllowedHandler(repos, registry);
 * const result = await handler.handle(command);
 */
class AllowedHandler {
  /**
   * Create a new AllowedHandler instance
   * @param {Object} repos - Repository container with commandRepo
   * @param {CommandRegistry} registry - Command registry for metadata
   */
  constructor(repos, registry) {
    /** @type {Object} */
    this.repos = repos;
    /** @type {CommandRegistry} */
    this.registry = registry;
  }

  /**
   * Handle allowed command execution
   * @param {Command} command - Command with args [category, page]
   * @returns {Promise<CommandResult>} Paginated list of allowed commands
   */
  async handle(command) {
    const [category, pageRaw] = command.args;
    const page = Number(pageRaw) || 1;

    const allowed = await this.repos.commandRepo.listAllowed();
    const meta = this.registry.listCommands();

    const merged = allowed.map((a) => {
      const m = meta.find((x) => x.name === a.command);
      return {
        name: a.command,
        category: m?.category || 'unknown',
        description: m?.description || 'No description',
      };
    });

    const filtered = category ? merged.filter((m) => m.category === category) : merged;

    const PAGE_SIZE = 5;
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), pages);
    const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return CommandResult.ok({
      type: 'list',
      category: category || null,
      page: safePage,
      pages,
      items,
    });
  }
}

module.exports = AllowedHandler;
