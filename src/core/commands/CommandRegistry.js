class CommandRegistry {
  constructor() {
    // name -> { handler, category, description, usage, examples, group, options, permissions, cooldown }
    this.handlers = new Map();
  }

  register(name, handler, options = {}) {
    const entry = {
      handler,
      category: options.category || 'core',
      group: options.group || 'core',
      description: options.description || 'No description provided.',
      usage: options.usage || `/${options.group || 'core'} ${name}`,
      examples: options.examples || [],
      options: options.options || [],
      permissions: options.permissions || null,
      cooldown: options.cooldown || null
    };
    this.handlers.set(name, entry);
  }

  getHandler(name) {
    return this.handlers.get(name)?.handler;
  }

  getMeta(name) {
    return this.handlers.get(name);
  }

  listCommands() {
    return Array.from(this.handlers.entries()).map(([name, meta]) => ({
      name,
      ...meta
    }));
  }

  listByGroup() {
    const map = new Map(); // group -> [meta]
    for (const [name, meta] of this.handlers.entries()) {
      const group = meta.group || 'core';
      if (!map.has(group)) map.set(group, []);
      map.get(group).push({ name, ...meta });
    }
    return map;
  }
}

module.exports = CommandRegistry;
