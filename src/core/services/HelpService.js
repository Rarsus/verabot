/**
 * Service for providing command help and documentation
 * @class HelpService
 * @example
 * const helpService = new HelpService(registry);
 * const categories = helpService.listCategories();
 * const commands = helpService.getCommandsByCategory('core');
 */
class HelpService {
  /**
   * Create a new HelpService instance
   * @param {CommandRegistry} registry - Command registry for metadata lookup
   */
  constructor(registry) {
    /** @type {CommandRegistry} */
    this.registry = registry;
    /** @type {number} */
    this.PAGE_SIZE = 5;
  }

  /**
   * List all available command categories
   * @returns {string[]} Array of unique category names
   */
  listCategories() {
    const commands = this.registry.listCommands();
    return [...new Set(commands.map((c) => c.category))];
  }

  /**
   * Get commands filtered by category
   * @param {string} [category] - Category to filter by (all if null/undefined)
   * @returns {Array<Object>} Commands in the category
   */
  getCommandsByCategory(category) {
    return this.registry.listCommands().filter((c) => !category || c.category === category);
  }

  /**
   * Paginate a list of commands
   * @param {Array<Object>} commands - Commands to paginate
   * @param {number} [page=1] - Page number to retrieve
   * @returns {Object} Pagination info with items
   * @returns {number} .page - Current page
   * @returns {number} .pages - Total pages
   * @returns {number} .total - Total items
   * @returns {Array<Object>} .items - Items on current page
   */
  paginate(commands, page = 1) {
    const total = commands.length;
    const pages = Math.max(1, Math.ceil(total / this.PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), pages);
    const start = (safePage - 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    return {
      page: safePage,
      pages,
      total,
      items: commands.slice(start, end),
    };
  }

  /**
   * Get autocomplete suggestions for a command prefix
   * @param {string} prefix - Command name prefix to match
   * @returns {string[]} Up to 10 matching command names
   */
  autocomplete(prefix) {
    const commands = this.registry.listCommands();
    return commands
      .filter((c) => c.name.startsWith(prefix.toLowerCase()))
      .slice(0, 10)
      .map((c) => c.name);
  }

  /**
   * Get detailed help information for a command
   * @param {string} name - Command name
   * @returns {Object|undefined} Command metadata or undefined if not found
   */
  getCommandHelp(name) {
    return this.registry.getMeta(name);
  }
}

module.exports = HelpService;
