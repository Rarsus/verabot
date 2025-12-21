const SayHandler = require('../../../../src/app/handlers/messaging/SayHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('SayHandler', () => {
  let handler;
  let mockMessageService;

  beforeEach(() => {
    mockMessageService = {
      broadcast: jest.fn().mockResolvedValue(undefined),
    };
    handler = new SayHandler(mockMessageService);
  });

  it('should broadcast message with provided text', async () => {
    const command = { args: ['hello', 'world'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockMessageService.broadcast).toHaveBeenCalledWith(command, 'hello world');
  });

  it('should return the message text', async () => {
    const command = { args: ['test', 'message'] };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('test message');
  });

  it('should handle single word messages', async () => {
    const command = { args: ['hello'] };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('hello');
    expect(mockMessageService.broadcast).toHaveBeenCalledWith(command, 'hello');
  });

  it('should handle empty args with default message', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('Nothing to say.');
    expect(mockMessageService.broadcast).toHaveBeenCalledWith(command, 'Nothing to say.');
  });

  it('should join multiple words with spaces', async () => {
    const command = { args: ['this', 'is', 'a', 'long', 'message'] };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('this is a long message');
    expect(mockMessageService.broadcast).toHaveBeenCalledWith(command, 'this is a long message');
  });

  it('should propagate broadcast errors', async () => {
    mockMessageService.broadcast.mockRejectedValue(new Error('Send failed'));
    const command = { args: ['test'] };

    await expect(handler.handle(command)).rejects.toThrow('Send failed');
  });

  it('should handle special characters in message', async () => {
    const command = { args: ['hello!', '@everyone', '#general'] };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('hello! @everyone #general');
  });
});
