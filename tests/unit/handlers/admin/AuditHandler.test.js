const AuditHandler = require('../../../../src/app/handlers/admin/AuditHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AuditHandler', () => {
  let handler;
  let mockRepos;

  beforeEach(() => {
    mockRepos = {
      permissionRepo: {
        listAudit: jest.fn()
      }
    };
    handler = new AuditHandler(mockRepos);
  });

  it('should list audit entries with default limit of 20', async () => {
    const mockEntries = [
      { id: 1, action: 'allow', command: 'ping', user: 'user1' },
      { id: 2, action: 'deny', command: 'say', user: 'user2' }
    ];
    mockRepos.permissionRepo.listAudit.mockResolvedValue(mockEntries);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.listAudit).toHaveBeenCalledWith(20);
    expect(result.data.entries).toEqual(mockEntries);
  });

  it('should use custom limit from args', async () => {
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      action: 'allow'
    }));
    mockRepos.permissionRepo.listAudit.mockResolvedValue(mockEntries);

    const command = { args: ['50'] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.listAudit).toHaveBeenCalledWith(50);
    expect(result.data.entries.length).toBe(50);
  });

  it('should return audit list with correct type', async () => {
    mockRepos.permissionRepo.listAudit.mockResolvedValue([]);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.data.type).toBe('audit');
  });

  it('should handle non-numeric limit with default', async () => {
    const mockEntries = [];
    mockRepos.permissionRepo.listAudit.mockResolvedValue(mockEntries);

    const command = { args: ['invalid'] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockRepos.permissionRepo.listAudit).toHaveBeenCalledWith(20);
  });

  it('should return empty audit when no entries', async () => {
    mockRepos.permissionRepo.listAudit.mockResolvedValue([]);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.entries).toEqual([]);
  });

  it('should propagate repo errors', async () => {
    mockRepos.permissionRepo.listAudit.mockRejectedValue(new Error('DB error'));

    const command = { args: [] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });

  it('should handle large limit values', async () => {
    const mockEntries = [];
    mockRepos.permissionRepo.listAudit.mockResolvedValue(mockEntries);

    const command = { args: ['1000'] };
    const result = await handler.handle(command);

    expect(mockRepos.permissionRepo.listAudit).toHaveBeenCalledWith(1000);
    expect(result.success).toBe(true);
  });

  it('should handle zero limit', async () => {
    const mockEntries = [];
    mockRepos.permissionRepo.listAudit.mockResolvedValue(mockEntries);

    const command = { args: ['0'] };
    const result = await handler.handle(command);

    expect(mockRepos.permissionRepo.listAudit).toHaveBeenCalledWith(20);
  });
});
