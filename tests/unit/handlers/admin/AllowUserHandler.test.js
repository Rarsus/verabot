const AllowUserHandler = require('../../../../src/app/handlers/admin/AllowUserHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AllowUserHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      permissionRepo: {
        addUser: jest.fn().mockResolvedValue(undefined)
      }
    };
    handler = new AllowUserHandler(mockRepos);
  });

  it('should add user permission for command', async () => {
    const command = { args: ['ping', 'user123'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.addUser).toHaveBeenCalledWith('ping', 'user123');
  });

  it('should return success message with command and user', async () => {
    const command = { args: ['say', 'user456'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('user456');
    expect(result.data.message).toContain('say');
  });

  it('should fail when command name is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should fail when user ID is missing', async () => {
    const command = { args: ['ping'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should fail when both arguments missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
  });

  it('should propagate repo errors', async () => {
    mockRepos.permissionRepo.addUser.mockRejectedValue(new Error('DB error'));
    const command = { args: ['ping', 'user123'] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
