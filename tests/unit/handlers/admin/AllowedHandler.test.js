const AllowedHandler = require('../../../../src/app/handlers/admin/AllowedHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('AllowedHandler', () => {
  let handler;
  let mockRepos;
  let mockRegistry;

  beforeEach(() => {
    mockRepos = {
      commandRepo: {
        listAllowed: jest.fn()
      }
    };
    mockRegistry = {
      listCommands: jest.fn()
    };
    handler = new AllowedHandler(mockRepos, mockRegistry);
  });

  it('should list all allowed commands', async () => {
    mockRepos.commandRepo.listAllowed.mockResolvedValue([
      { command: 'ping' },
      { command: 'say' }
    ]);
    mockRegistry.listCommands.mockReturnValue([
      { name: 'ping', category: 'core', description: 'Ping command' },
      { name: 'say', category: 'messaging', description: 'Say command' }
    ]);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.items.length).toBe(2);
    expect(result.data.items[0].name).toBe('ping');
  });

  it('should filter by category', async () => {
    mockRepos.commandRepo.listAllowed.mockResolvedValue([
      { command: 'ping' },
      { command: 'say' }
    ]);
    mockRegistry.listCommands.mockReturnValue([
      { name: 'ping', category: 'core', description: 'Ping' },
      { name: 'say', category: 'messaging', description: 'Say' }
    ]);

    const command = { args: ['core'] };
    const result = await handler.handle(command);

    expect(result.data.category).toBe('core');
    expect(result.data.items.length).toBe(1);
    expect(result.data.items[0].name).toBe('ping');
  });

  it('should paginate results', async () => {
    const allowed = Array.from({ length: 12 }, (_, i) => ({
      command: `cmd${i}`
    }));
    const meta = Array.from({ length: 12 }, (_, i) => ({
      name: `cmd${i}`,
      category: 'core',
      description: `Command ${i}`
    }));

    mockRepos.commandRepo.listAllowed.mockResolvedValue(allowed);
    mockRegistry.listCommands.mockReturnValue(meta);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.data.pages).toBe(3); // 12 items / 5 per page = 3 pages
    expect(result.data.items.length).toBe(5);
    expect(result.data.page).toBe(1);
  });

  it('should handle page 2', async () => {
    const allowed = Array.from({ length: 12 }, (_, i) => ({
      command: `cmd${i}`
    }));
    const meta = Array.from({ length: 12 }, (_, i) => ({
      name: `cmd${i}`,
      category: 'core',
      description: `Command ${i}`
    }));

    mockRepos.commandRepo.listAllowed.mockResolvedValue(allowed);
    mockRegistry.listCommands.mockReturnValue(meta);

    const command = { args: [null, '2'] };
    const result = await handler.handle(command);

    expect(result.data.page).toBe(2);
    expect(result.data.items[0].name).toBe('cmd5');
  });

  it('should handle unknown commands gracefully', async () => {
    mockRepos.commandRepo.listAllowed.mockResolvedValue([
      { command: 'unknown-cmd' }
    ]);
    mockRegistry.listCommands.mockReturnValue([
      { name: 'ping', category: 'core' }
    ]);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.items[0].category).toBe('unknown');
    expect(result.data.items[0].description).toBe('No description');
  });

  it('should return empty list when no commands allowed', async () => {
    mockRepos.commandRepo.listAllowed.mockResolvedValue([]);
    mockRegistry.listCommands.mockReturnValue([]);

    const command = { args: [] };
    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.items).toEqual([]);
    expect(result.data.pages).toBe(1);
  });

  it('should propagate repo errors', async () => {
    mockRepos.commandRepo.listAllowed.mockRejectedValue(new Error('DB error'));

    const command = { args: [] };

    await expect(handler.handle(command)).rejects.toThrow('DB error');
  });
});
