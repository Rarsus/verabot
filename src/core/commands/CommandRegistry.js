/**
 * @typedef {Object} CommandEntry
 * @property {Function} handler - The command handler function
 * @property {string} category - Command category
 * @property {string} group - Command group
 * @property {string} description - Command description
 * @property {string} usage - Usage instructions
 * @property {string[]} examples - Usage examples
 * @property {Object[]} options - Command options/parameters
 * @property {string} [permissions] - Required permissions
 * @property {number} [cooldown] - Cooldown in milliseconds
 */

/**
 * Registry for storing and retrieving command handlers and metadata
 * @class CommandRegistry
 * @example
 * const registry = new CommandRegistry();
 * registry.register('ping', (cmd) => ({ success: true }), {
 *   category: 'core',
 *   description: 'Ping the bot'
 * });
 */
class CommandRegistry {
  /**
   * Create a new CommandRegistry instance
   */
  constructor() {
    // name -> { handler, category, description, usage, examples, group, options, permissions, cooldown }
    /** @type {Map<string, CommandEntry>} */
    this.handlers = new Map();
  }

  /**
   * Register a new command handler
   * @param {string} name - Command name
   * @param {Function} handler - Command handler function
   * @param {Object} [options={}] - Command configuration options
   * @param {string} [options.category='core'] - Command category
   * @param {string} [options.group='core'] - Command group
   * @param {string} [options.description] - Command description
   * @param {string} [options.usage] - Usage instructions
   * @param {string[]} [options.examples=[]] - Usage examples
   * @param {Object[]} [options.options=[]] - Command parameters
   * @param {string} [options.permissions] - Required permissions
   * @param {number} [options.cooldown] - Cooldown in milliseconds
   */
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

  /**
   * Get the handler function for a command
   * @param {string} name - Command name
   * @returns {Function|undefined} The command handler function, or undefined if not found
   */
  getHandler(name) {
    return this.handlers.get(name)?.handler;
  }

  /**
   * Get the metadata for a command
   * @param {string} name - Command name
   * @returns {CommandEntry|undefined} The command metadata, or undefined if not found
   */
  getMeta(name) {
    return this.handlers.get(name);
  }

  /**
   * List all registered commands
   * @returns {Array<{name: string} & CommandEntry>} Array of all commands with their metadata
   */
  listCommands() {
    return Array.from(this.handlers.entries()).map(([name, meta]) => ({
      name,
      ...meta
    }));
  }

  /**
   * List all commands grouped by their group
   * @returns {Map<string, Array<{name: string} & CommandEntry>>} Map of groups to commands
   */
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

