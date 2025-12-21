const AllowHandler = require('../../../../src/app/handlers/admin/AllowHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AllowHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      commandRepo: {
        addAllowed: jest.fn().mockResolvedValue(undefined),
      },
    };
    handler = new AllowHandler(mockRepos);
  });

  it('should add command to allowed list', async () => {
    const command = { args: ['ping'], userId: 'user123' };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.commandRepo.addAllowed).toHaveBeenCalledWith('ping', 'user123');
  });

  it('should return success message with command name', async () => {
    const command = { args: ['test-cmd'], userId: 'user123' };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('test-cmd');
    expect(result.data.message).toContain('allowed');
  });

  it('should fail when command name is missing', async () => {
    const command = { args: [], userId: 'user123' };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Missing');
  });

  it('should fail when command name is undefined', async () => {
    const command = { args: [undefined], userId: 'user123' };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
  });

  it('should propagate repo errors', async () => {
    mockRepos.commandRepo.addAllowed.mockRejectedValue(new Error('DB error'));
    const command = { args: ['test'], userId: 'user123' };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
