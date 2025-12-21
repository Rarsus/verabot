class CommandBus {
  constructor(registry, pipeline) {
    this.registry = registry;
    this.pipeline = pipeline;
  }

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
      category: meta.category || 'core'
    };

    return this.pipeline.execute(context, async (ctx) => handler.handle(ctx.command));
  }
}

module.exports = CommandBus;
