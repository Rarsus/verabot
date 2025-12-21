const DenyHandler = require('../../../../src/app/handlers/admin/DenyHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('DenyHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      commandRepo: {
        removeAllowed: jest.fn().mockResolvedValue(undefined)
      }
    };
    handler = new DenyHandler(mockRepos);
  });

  it('should remove command from allowed list', async () => {
    const command = { args: ['ping'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.commandRepo.removeAllowed).toHaveBeenCalledWith('ping');
  });

  it('should return success message with command name', async () => {
    const command = { args: ['test-cmd'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('test-cmd');
    expect(result.data.message).toContain('denied');
  });

  it('should fail when command name is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Missing');
  });

  it('should propagate repo errors', async () => {
    mockRepos.commandRepo.removeAllowed.mockRejectedValue(new Error('DB error'));
    const command = { args: ['test'] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
