const BroadcastHandler = require('../../../../src/app/handlers/messaging/BroadcastHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('BroadcastHandler', () => {
  let handler;
  let mockDiscordClient;
  let mockChannels;

  beforeEach(() => {
    mockChannels = new Map([
      ['ch1', { isTextBased: () => true, send: jest.fn().mockResolvedValue(undefined) }],
      ['ch2', { isTextBased: () => true, send: jest.fn().mockResolvedValue(undefined) }],
      ['ch3', { isTextBased: () => false, send: jest.fn() }]
    ]);

    mockDiscordClient = {
      channels: {
        cache: mockChannels
      }
    };
    handler = new BroadcastHandler(mockDiscordClient);
  });

  it('should broadcast message to text channels', async () => {
    const command = { args: ['hello', 'everyone'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toContain('2'); // 2 text channels
    expect(mockChannels.get('ch1').send).toHaveBeenCalledWith('hello everyone');
    expect(mockChannels.get('ch2').send).toHaveBeenCalledWith('hello everyone');
  });

  it('should not send to non-text channels', async () => {
    const command = { args: ['test'] };

    await handler.handle(command);

    expect(mockChannels.get('ch3').send).not.toHaveBeenCalled();
  });

  it('should count sent channels', async () => {
    const command = { args: ['broadcast'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('Broadcast sent to 2 channels');
  });

  it('should fail when no message provided', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('No message');
  });

  it('should handle empty text gracefully', async () => {
    const command = { args: ['', ' ', ''] };

    const result = await handler.handle(command);

    // This will join to "  " which is truthy, so it broadcasts
    expect(result.success).toBe(true);
  });

  it('should continue on channel send errors', async () => {
    mockChannels.get('ch1').send.mockRejectedValue(new Error('Send failed'));
    const command = { args: ['test'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    // Should still count ch2 even though ch1 failed
    expect(result.data.message).toContain('Broadcast sent to');
  });

  it('should send to all working text channels', async () => {
    const command = { args: ['hello', 'world'] };

    await handler.handle(command);

    expect(mockChannels.get('ch1').send).toHaveBeenCalled();
    expect(mockChannels.get('ch2').send).toHaveBeenCalled();
  });

  it('should join all args as message', async () => {
    const command = { args: ['this', 'is', 'a', 'long', 'message'] };

    await handler.handle(command);

    const expectedMessage = 'this is a long message';
    expect(mockChannels.get('ch1').send).toHaveBeenCalledWith(expectedMessage);
  });
});
