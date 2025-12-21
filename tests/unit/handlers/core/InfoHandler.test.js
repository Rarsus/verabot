const InfoHandler = require('../../../../src/app/handlers/core/InfoHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('InfoHandler', () => {
  let handler;
  let mockStatusProvider;

  beforeEach(() => {
    mockStatusProvider = {
      getStatus: jest.fn().mockResolvedValue({
        uptime: 12345,
        version: '1.0.0',
        status: 'online'
      })
    };
    handler = new InfoHandler(mockStatusProvider);
  });

  describe('handle', () => {
    it('should return status information', async () => {
      const result = await handler.handle();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        uptime: 12345,
        version: '1.0.0',
        status: 'online'
      });
    });

    it('should call statusProvider.getStatus', async () => {
      await handler.handle();

      expect(mockStatusProvider.getStatus).toHaveBeenCalled();
    });

    it('should return a CommandResult instance', async () => {
      const result = await handler.handle();

      expect(result).toBeInstanceOf(CommandResult);
    });

    it('should have no error on success', async () => {
      const result = await handler.handle();

      expect(result.error).toBeNull();
    });

    it('should handle status provider errors', async () => {
      const error = new Error('Status provider failed');
      mockStatusProvider.getStatus.mockRejectedValue(error);

      await expect(handler.handle()).rejects.toThrow('Status provider failed');
    });
  });
});
