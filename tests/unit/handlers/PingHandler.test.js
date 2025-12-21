const PingHandler = require('../../../src/app/handlers/core/PingHandler');

describe('PingHandler', () => {
  it('returns pong', async () => {
    const handler = new PingHandler();
    const result = await handler.handle({});

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('pong');
  });
});
