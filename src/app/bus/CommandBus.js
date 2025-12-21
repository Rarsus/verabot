/**
 * @typedef {Object} CommandContext
 * @property {Command} command - The command being executed
 * @property {string} category - The command category
 */

/**
 * Command bus for executing commands through a middleware pipeline
 * @class CommandBus
 * @example
 * const bus = new CommandBus(registry, pipeline);
 * const result = await bus.execute(command);
 */
class CommandBus {
  /**
   * Create a new CommandBus instance
   * @param {CommandRegistry} registry - The command registry
   * @param {MiddlewarePipeline} pipeline - The middleware pipeline
   */
  constructor(registry, pipeline) {
    /** @type {CommandRegistry} */
    this.registry = registry;
    /** @type {MiddlewarePipeline} */
    this.pipeline = pipeline;
  }

  /**
   * Execute a command through the middleware pipeline
   * @param {Command} command - The command to execute
   * @returns {Promise<CommandResult>} The command execution result
   * @throws {Error} If command handler is not found
   * @example
   * try {
   *   const result = await bus.execute(command);
   *   console.log('Result:', result.data);
   * } catch (err) {
   *   console.error('Failed:', err.message);
   * }
   */
  async execute(command) {
    const meta = this.registry.getMeta(command.name);
    if (!meta) {
      const error = new Error(`No handler for command '${command.name}'`);
      error.code = 'COMMAND_NOT_FOUND';
      throw error;
    }
    const handler = meta.handler;

    const context = {
      command,
      category: meta.category || 'core',
    };

    return this.pipeline.execute(context, async (ctx) => handler.handle(ctx.command));
  }
}

module.exports = CommandBus;
