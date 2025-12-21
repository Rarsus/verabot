class HelpService {
  constructor(registry) {
    this.registry = registry;
    this.PAGE_SIZE = 5;
  }

  listCategories() {
    const commands = this.registry.listCommands();
    return [...new Set(commands.map(c => c.category))];
  }

  getCommandsByCategory(category) {
    return this.registry
      .listCommands()
      .filter(c => !category || c.category === category);
  }

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
      items: commands.slice(start, end)
    };
  }

  autocomplete(prefix) {
    const commands = this.registry.listCommands();
    return commands
      .filter(c => c.name.startsWith(prefix.toLowerCase()))
      .slice(0, 10)
      .map(c => c.name);
  }

  getCommandHelp(name) {
    return this.registry.getMeta(name);
  }
}

module.exports = HelpService;
