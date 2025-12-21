const NotifyHandler = require('../../../../src/app/handlers/messaging/NotifyHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('NotifyHandler', () => {
  let handler;
  let mockDiscordClient;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    mockDiscordClient = {
      users: {
        fetch: jest.fn().mockResolvedValue(mockUser),
      },
    };
    handler = new NotifyHandler(mockDiscordClient);
  });

  it('should send DM to user', async () => {
    const command = { args: ['user123', 'hello'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDiscordClient.users.fetch).toHaveBeenCalledWith('user123');
    expect(mockUser.send).toHaveBeenCalledWith('hello');
  });

  it('should return success message', async () => {
    const command = { args: ['user456', 'test'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('DM sent');
    expect(result.data.message).toContain('user456');
  });

  it('should join multiple message parts', async () => {
    const command = { args: ['user123', 'hello', 'world', 'test'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockUser.send).toHaveBeenCalledWith('hello world test');
  });

  it('should handle missing message with default', async () => {
    const command = { args: ['user123'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockUser.send).toHaveBeenCalledWith('(no message)');
  });

  it('should fail when user ID is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Missing user ID');
  });

  it('should handle user fetch errors', async () => {
    mockDiscordClient.users.fetch.mockRejectedValue(new Error('User not found'));
    const command = { args: ['invalid-user', 'hello'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Failed to DM');
  });

  it('should handle DM send errors', async () => {
    mockUser.send.mockRejectedValue(new Error('DMs disabled'));
    const command = { args: ['user123', 'hello'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Failed to DM');
  });
});
