const AllowChannelHandler = require('../../../../src/app/handlers/admin/AllowChannelHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AllowChannelHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      permissionRepo: {
        addChannel: jest.fn().mockResolvedValue(undefined),
      },
    };
    handler = new AllowChannelHandler(mockRepos);
  });

  it('should add channel permission for command', async () => {
    const command = { args: ['ping', 'channel123'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.addChannel).toHaveBeenCalledWith('ping', 'channel123');
  });

  it('should return success message with command and channel', async () => {
    const command = { args: ['say', 'channel456'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('channel456');
    expect(result.data.message).toContain('say');
  });

  it('should fail when command name is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should fail when channel ID is missing', async () => {
    const command = { args: ['ping'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should propagate repo errors', async () => {
    mockRepos.permissionRepo.addChannel.mockRejectedValue(new Error('DB error'));
    const command = { args: ['ping', 'channel123'] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
