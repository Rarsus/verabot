const CommandRegistry = require('../../../src/core/commands/CommandRegistry');

describe('CommandRegistry', () => {
  let registry;
  let mockHandler;

  beforeEach(() => {
    registry = new CommandRegistry();
    mockHandler = jest.fn();
  });

  describe('register', () => {
    it('should register a command with minimal options', () => {
      registry.register('ping', mockHandler);

      const handler = registry.getHandler('ping');
      expect(handler).toBe(mockHandler);
    });

    it('should register a command with full options', () => {
      const options = {
        category: 'admin',
        group: 'moderation',
        description: 'Ban a user',
        usage: '/mod ban <user>',
        examples: ['/mod ban spammer'],
        permissions: ['ADMINISTRATOR'],
        cooldown: 5000,
      };

      registry.register('ban', mockHandler, options);
      const meta = registry.getMeta('ban');

      expect(meta.handler).toBe(mockHandler);
      expect(meta.category).toBe('admin');
      expect(meta.group).toBe('moderation');
      expect(meta.description).toBe('Ban a user');
      expect(meta.cooldown).toBe(5000);
    });

    it('should use default values for missing options', () => {
      registry.register('test', mockHandler);
      const meta = registry.getMeta('test');

      expect(meta.category).toBe('core');
      expect(meta.group).toBe('core');
      expect(meta.description).toBe('No description provided.');
      expect(meta.examples).toEqual([]);
      expect(meta.permissions).toBeNull();
      expect(meta.cooldown).toBeNull();
    });
  });

  describe('getHandler', () => {
    it('should return registered handler', () => {
      registry.register('ping', mockHandler);

      const handler = registry.getHandler('ping');
      expect(handler).toBe(mockHandler);
    });

    it('should return undefined for unregistered command', () => {
      const handler = registry.getHandler('nonexistent');
      expect(handler).toBeUndefined();
    });
  });

  describe('getMeta', () => {
    it('should return full metadata for registered command', () => {
      const options = { category: 'test', description: 'Test command' };
      registry.register('test', mockHandler, options);

      const meta = registry.getMeta('test');

      expect(meta).toBeDefined();
      expect(meta.handler).toBe(mockHandler);
      expect(meta.category).toBe('test');
      expect(meta.description).toBe('Test command');
    });

    it('should return undefined for unregistered command', () => {
      const meta = registry.getMeta('nonexistent');
      expect(meta).toBeUndefined();
    });
  });

  describe('listCommands', () => {
    it('should list all registered commands', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      registry.register('ping', handler1, { description: 'Ping command' });
      registry.register('help', handler2, { description: 'Help command' });

      const commands = registry.listCommands();

      expect(commands).toHaveLength(2);
      expect(commands[0].name).toBe('ping');
      expect(commands[1].name).toBe('help');
    });

    it('should include all metadata in listed commands', () => {
      registry.register('ping', mockHandler, {
        category: 'admin',
        description: 'Ping the bot',
      });

      const commands = registry.listCommands();

      expect(commands[0]).toHaveProperty('name', 'ping');
      expect(commands[0]).toHaveProperty('handler');
      expect(commands[0]).toHaveProperty('category', 'admin');
      expect(commands[0]).toHaveProperty('description', 'Ping the bot');
    });

    it('should return empty array when no commands registered', () => {
      const commands = registry.listCommands();
      expect(commands).toEqual([]);
    });
  });
});
