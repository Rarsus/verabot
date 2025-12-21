const HelpService = require('../../../src/core/services/HelpService');

describe('HelpService', () => {
  let service;
  let mockRegistry;

  beforeEach(() => {
    mockRegistry = {
      listCommands: jest.fn(),
      getMeta: jest.fn()
    };
    service = new HelpService(mockRegistry);
  });

  describe('listCategories', () => {
    it('should return unique categories from registry', () => {
      mockRegistry.listCommands.mockReturnValue([
        { name: 'ping', category: 'core' },
        { name: 'info', category: 'core' },
        { name: 'say', category: 'messaging' },
        { name: 'deploy', category: 'operations' }
      ]);

      const categories = service.listCategories();

      expect(categories).toContain('core');
      expect(categories).toContain('messaging');
      expect(categories).toContain('operations');
      expect(categories.length).toBe(3);
    });

    it('should return empty array when no commands exist', () => {
      mockRegistry.listCommands.mockReturnValue([]);

      const categories = service.listCategories();

      expect(categories).toEqual([]);
    });

    it('should not include duplicate categories', () => {
      mockRegistry.listCommands.mockReturnValue([
        { name: 'ping', category: 'core' },
        { name: 'info', category: 'core' },
        { name: 'help', category: 'core' }
      ]);

      const categories = service.listCategories();

      expect(categories.length).toBe(1);
      expect(categories[0]).toBe('core');
    });
  });

  describe('getCommandsByCategory', () => {
    beforeEach(() => {
      mockRegistry.listCommands.mockReturnValue([
        { name: 'ping', category: 'core' },
        { name: 'info', category: 'core' },
        { name: 'say', category: 'messaging' },
        { name: 'deploy', category: 'operations' }
      ]);
    });

    it('should filter commands by category', () => {
      const commands = service.getCommandsByCategory('core');

      expect(commands.length).toBe(2);
      expect(commands.every(c => c.category === 'core')).toBe(true);
    });

    it('should return all commands when no category specified', () => {
      const commands = service.getCommandsByCategory(null);

      expect(commands.length).toBe(4);
    });

    it('should return empty array for non-existent category', () => {
      const commands = service.getCommandsByCategory('nonexistent');

      expect(commands).toEqual([]);
    });

    it('should return commands in same order as registry', () => {
      const commands = service.getCommandsByCategory('core');

      expect(commands[0].name).toBe('ping');
      expect(commands[1].name).toBe('info');
    });
  });

  describe('paginate', () => {
    const mockCommands = [
      { name: 'cmd1', category: 'core' },
      { name: 'cmd2', category: 'core' },
      { name: 'cmd3', category: 'core' },
      { name: 'cmd4', category: 'core' },
      { name: 'cmd5', category: 'core' },
      { name: 'cmd6', category: 'core' },
      { name: 'cmd7', category: 'core' },
      { name: 'cmd8', category: 'core' }
    ];

    it('should paginate commands with default page size of 5', () => {
      const result = service.paginate(mockCommands, 1);

      expect(result.page).toBe(1);
      expect(result.items.length).toBe(5);
      expect(result.items[0].name).toBe('cmd1');
      expect(result.items[4].name).toBe('cmd5');
    });

    it('should return correct page 2', () => {
      const result = service.paginate(mockCommands, 2);

      expect(result.page).toBe(2);
      expect(result.items.length).toBe(3);
      expect(result.items[0].name).toBe('cmd6');
    });

    it('should calculate correct total pages', () => {
      const result = service.paginate(mockCommands, 1);

      expect(result.pages).toBe(2);
      expect(result.total).toBe(8);
    });

    it('should return page 1 when page < 1', () => {
      const result = service.paginate(mockCommands, 0);

      expect(result.page).toBe(1);
    });

    it('should return last page when page > total pages', () => {
      const result = service.paginate(mockCommands, 10);

      expect(result.page).toBe(2);
      expect(result.items.length).toBe(3);
    });

    it('should default to page 1', () => {
      const result = service.paginate(mockCommands);

      expect(result.page).toBe(1);
    });

    it('should handle single item pagination', () => {
      const result = service.paginate([{ name: 'only' }], 1);

      expect(result.pages).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
    });

    it('should handle empty command list', () => {
      const result = service.paginate([], 1);

      expect(result.pages).toBe(1);
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  describe('autocomplete', () => {
    beforeEach(() => {
      mockRegistry.listCommands.mockReturnValue([
        { name: 'ping', category: 'core' },
        { name: 'pong', category: 'core' },
        { name: 'help', category: 'core' },
        { name: 'say', category: 'messaging' }
      ]);
    });

    it('should return commands starting with prefix', () => {
      const results = service.autocomplete('p');

      expect(results).toContain('ping');
      expect(results).toContain('pong');
      expect(results).not.toContain('help');
    });

    it('should be case-insensitive', () => {
      const results = service.autocomplete('P');

      expect(results).toContain('ping');
      expect(results).toContain('pong');
    });

    it('should limit results to 10', () => {
      const commands = Array.from({ length: 15 }, (_, i) => ({
        name: `test${i}`,
        category: 'core'
      }));
      mockRegistry.listCommands.mockReturnValue(commands);

      const results = service.autocomplete('test');

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no matches', () => {
      const results = service.autocomplete('xyz');

      expect(results).toEqual([]);
    });

    it('should return only command names', () => {
      const results = service.autocomplete('p');

      expect(results.every(r => typeof r === 'string')).toBe(true);
    });
  });

  describe('getCommandHelp', () => {
    it('should call registry getMeta with command name', () => {
      const mockMeta = { category: 'core', description: 'Test' };
      mockRegistry.getMeta.mockReturnValue(mockMeta);

      const result = service.getCommandHelp('ping');

      expect(mockRegistry.getMeta).toHaveBeenCalledWith('ping');
      expect(result).toEqual(mockMeta);
    });

    it('should return null when command not found', () => {
      mockRegistry.getMeta.mockReturnValue(null);

      const result = service.getCommandHelp('nonexistent');

      expect(result).toBeNull();
    });

    it('should return command metadata', () => {
      const mockMeta = {
        name: 'ping',
        category: 'core',
        description: 'Ping pong',
        usage: '!ping',
        examples: ['!ping']
      };
      mockRegistry.getMeta.mockReturnValue(mockMeta);

      const result = service.getCommandHelp('ping');

      expect(result.category).toBe('core');
      expect(result.description).toBe('Ping pong');
    });
  });
});
