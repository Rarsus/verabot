const PingHandler = require('../../../../src/app/handlers/core/PingHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('PingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new PingHandler();
  });

  describe('handle', () => {
    it('should respond with pong', async () => {
      const result = await handler.handle();

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('pong');
    });

    it('should return a CommandResult instance', async () => {
      const result = await handler.handle();

      expect(result).toBeInstanceOf(CommandResult);
    });

    it('should have valid result structure', async () => {
      const result = await handler.handle();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('should have no error on success', async () => {
      const result = await handler.handle();

      expect(result.error).toBeNull();
    });
  });
});
