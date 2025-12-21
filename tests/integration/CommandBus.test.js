const CommandBus = require('../../src/app/bus/CommandBus');
const MiddlewarePipeline = require('../../src/app/bus/MiddlewarePipeline');
const CommandRegistry = require('../../src/core/commands/CommandRegistry');
const PingHandler = require('../../src/app/handlers/core/PingHandler');

describe('CommandBus integration', () => {
  it('executes ping through an empty pipeline', async () => {
    const registry = new CommandRegistry();
    registry.register('ping', new PingHandler(), { category: 'core', group: 'core' });
    const pipeline = new MiddlewarePipeline([]);
    const bus = new CommandBus(registry, pipeline);

    const result = await bus.execute({ name: 'ping', source: 'test', args: [] });

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('pong');
  });
});
