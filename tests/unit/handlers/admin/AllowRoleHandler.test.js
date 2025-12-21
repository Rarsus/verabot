const AllowRoleHandler = require('../../../../src/app/handlers/admin/AllowRoleHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AllowRoleHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      permissionRepo: {
        addRole: jest.fn().mockResolvedValue(undefined)
      }
    };
    handler = new AllowRoleHandler(mockRepos);
  });

  it('should add role permission for command', async () => {
    const command = { args: ['ping', 'admin-role'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.addRole).toHaveBeenCalledWith('ping', 'admin-role');
  });

  it('should return success message with command and role', async () => {
    const command = { args: ['say', 'moderator'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('moderator');
    expect(result.data.message).toContain('say');
  });

  it('should fail when command name is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should fail when role ID is missing', async () => {
    const command = { args: ['ping'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Usage');
  });

  it('should propagate repo errors', async () => {
    mockRepos.permissionRepo.addRole.mockRejectedValue(new Error('DB error'));
    const command = { args: ['ping', 'admin'] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
