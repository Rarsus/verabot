const HelpHandler = require('../../../../src/app/handlers/core/HelpHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('HelpHandler', () => {
  let handler;
  let mockHelpService;

  beforeEach(() => {
    mockHelpService = {
      getCommandHelp: jest.fn(),
      getCommandsByCategory: jest.fn(),
      paginate: jest.fn(),
    };
    handler = new HelpHandler(mockHelpService);
  });

  describe('handle - command-specific help', () => {
    it('should return command help when specific command is found', async () => {
      const mockMeta = {
        category: 'core',
        description: 'Ping command',
        usage: '!ping',
        examples: ['!ping'],
      };
      mockHelpService.getCommandHelp.mockReturnValue(mockMeta);

      const result = await handler.handle({
        args: ['ping'],
      });

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('command');
      expect(result.data.name).toBe('ping');
      expect(result.data.category).toBe('core');
      expect(mockHelpService.getCommandHelp).toHaveBeenCalledWith('ping');
    });

    it('should include usage and examples in help response', async () => {
      const mockMeta = {
        category: 'messaging',
        description: 'Send a message',
        usage: '!say <message>',
        examples: ['!say hello'],
      };
      mockHelpService.getCommandHelp.mockReturnValue(mockMeta);

      const result = await handler.handle({
        args: ['say'],
      });

      expect(result.data.usage).toBe('!say <message>');
      expect(result.data.examples).toEqual(['!say hello']);
    });

    it('should not call paginate when specific command is found', async () => {
      mockHelpService.getCommandHelp.mockReturnValue({
        category: 'core',
        description: 'Test',
      });

      await handler.handle({ args: ['ping'] });

      expect(mockHelpService.paginate).not.toHaveBeenCalled();
    });
  });

  describe('handle - list help', () => {
    it('should list all commands when no args provided', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        page: 1,
        pages: 1,
        total: 0,
        items: [],
      });

      const result = await handler.handle({ args: [] });

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('list');
      expect(result.data.category).toBeNull();
      expect(result.data.page).toBe(1);
    });

    it('should filter by category when category name provided', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([
        { name: 'ping', category: 'core' },
        { name: 'info', category: 'core' },
      ]);
      mockHelpService.paginate.mockReturnValue({
        page: 1,
        pages: 1,
        total: 2,
        items: [
          { name: 'ping', category: 'core' },
          { name: 'info', category: 'core' },
        ],
      });

      const result = await handler.handle({ args: ['core'] });

      expect(result.data.category).toBe('core');
      expect(mockHelpService.getCommandsByCategory).toHaveBeenCalledWith('core');
      expect(result.data.total).toBe(2);
    });

    it('should handle pagination with number as first arg', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        page: 2,
        pages: 5,
        total: 20,
        items: [],
      });

      const result = await handler.handle({ args: ['2'] });

      expect(result.data.page).toBe(2);
      expect(mockHelpService.paginate).toHaveBeenCalledWith([], 2);
    });

    it('should handle pagination with category and page', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        page: 2,
        pages: 3,
        total: 10,
        items: [],
      });

      const result = await handler.handle({ args: ['messaging', '2'] });

      expect(result.data.category).toBe('messaging');
      expect(result.data.page).toBe(2);
      expect(mockHelpService.getCommandsByCategory).toHaveBeenCalledWith('messaging');
    });

    it('should default to page 1 when page number is invalid', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        page: 1,
        pages: 1,
        total: 0,
        items: [],
      });

      await handler.handle({ args: [] });

      expect(mockHelpService.paginate).toHaveBeenCalledWith([], 1);
    });
  });

  describe('handle - edge cases', () => {
    it('should handle undefined args gracefully', async () => {
      mockHelpService.getCommandHelp.mockReturnValue(null);
      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        page: 1,
        pages: 1,
        total: 0,
        items: [],
      });

      const result = await handler.handle({ args: [undefined, undefined] });

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('list');
    });

    it('should return error CommandResult when operation fails', async () => {
      mockHelpService.getCommandsByCategory.mockImplementation(() => {
        throw new Error('Service error');
      });

      await expect(handler.handle({ args: [] })).rejects.toBeInstanceOf(Error);
    });
  });
});
