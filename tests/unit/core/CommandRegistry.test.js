const CommandRegistry = require('../../../src/core/commands/CommandRegistry');

describe('CommandRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('should create with empty handlers map', () => {
    expect(registry.handlers).toBeInstanceOf(Map);
    expect(registry.handlers.size).toBe(0);
  });

  it('should register a command handler', () => {
    const handler = jest.fn();

    registry.register('ping', handler);

    expect(registry.handlers.has('ping')).toBe(true);
    expect(registry.handlers.get('ping').handler).toBe(handler);
  });

  it('should register with default options', () => {
    const handler = jest.fn();

    registry.register('ping', handler);

    const entry = registry.handlers.get('ping');
    expect(entry.category).toBe('core');
    expect(entry.group).toBe('core');
    expect(entry.description).toBe('No description provided.');
    expect(entry.usage).toBe('/core ping');
    expect(entry.examples).toEqual([]);
    expect(entry.options).toEqual([]);
    expect(entry.permissions).toBeNull();
    expect(entry.cooldown).toBeNull();
  });

  it('should register with custom options', () => {
    const handler = jest.fn();
    const options = {
      category: 'admin',
      group: 'moderation',
      description: 'Ban a user',
      usage: '/mod ban <user>',
      examples: ['ban @user'],
      permissions: ['ADMINISTRATOR'],
      cooldown: 5000,
    };

    registry.register('ban', handler, options);

    const entry = registry.handlers.get('ban');
    expect(entry.category).toBe('admin');
    expect(entry.group).toBe('moderation');
    expect(entry.description).toBe('Ban a user');
    expect(entry.usage).toBe('/mod ban <user>');
    expect(entry.examples).toEqual(['ban @user']);
    expect(entry.permissions).toEqual(['ADMINISTRATOR']);
    expect(entry.cooldown).toBe(5000);
  });

  it('should get handler by name', () => {
    const handler = jest.fn();

    registry.register('ping', handler);

    expect(registry.getHandler('ping')).toBe(handler);
  });

  it('should return undefined for non-existent handler', () => {
    expect(registry.getHandler('nonexistent')).toBeUndefined();
  });

  it('should get metadata by name', () => {
    const handler = jest.fn();

    registry.register('ping', handler, { description: 'Test' });

    const meta = registry.getMeta('ping');
    expect(meta).toBeDefined();
    expect(meta.handler).toBe(handler);
    expect(meta.description).toBe('Test');
  });

  it('should return undefined for non-existent metadata', () => {
    expect(registry.getMeta('nonexistent')).toBeUndefined();
  });

  it('should list all commands', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    registry.register('ping', handler1, { category: 'core', group: 'core' });
    registry.register('ban', handler2, { category: 'admin', group: 'moderation' });

    const commands = registry.listCommands();

    expect(commands).toHaveLength(2);
    expect(commands[0].name).toBe('ping');
    expect(commands[1].name).toBe('ban');
    expect(commands[0].category).toBe('core');
    expect(commands[1].category).toBe('admin');
  });

  it('should list commands grouped by group', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();

    registry.register('ping', handler1, { group: 'core' });
    registry.register('help', handler2, { group: 'core' });
    registry.register('ban', handler3, { group: 'moderation' });

    const grouped = registry.listByGroup();

    expect(grouped.has('core')).toBe(true);
    expect(grouped.has('moderation')).toBe(true);
    expect(grouped.get('core')).toHaveLength(2);
    expect(grouped.get('moderation')).toHaveLength(1);
  });

  it('should default to core group in listByGroup', () => {
    const handler = jest.fn();

    registry.register('test', handler); // no group specified

    const grouped = registry.listByGroup();

    expect(grouped.has('core')).toBe(true);
    expect(grouped.get('core')).toContainEqual(expect.objectContaining({ name: 'test' }));
  });

  it('should handle multiple handlers in same group', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    registry.register('kick', handler1, { group: 'mod' });
    registry.register('ban', handler2, { group: 'mod' });

    const grouped = registry.listByGroup();
    const modCommands = grouped.get('mod');

    expect(modCommands).toHaveLength(2);
    expect(modCommands.map((c) => c.name)).toContain('kick');
    expect(modCommands.map((c) => c.name)).toContain('ban');
  });

  it('should overwrite handler with same name', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    registry.register('ping', handler1);
    registry.register('ping', handler2);

    expect(registry.getHandler('ping')).toBe(handler2);
  });

  it('should preserve metadata with options in listCommands', () => {
    const handler = jest.fn();
    const options = {
      category: 'admin',
      group: 'moderation',
      description: 'Test command',
      examples: ['example1', 'example2'],
    };

    registry.register('test', handler, options);

    const commands = registry.listCommands();
    const testCommand = commands.find((c) => c.name === 'test');

    expect(testCommand.category).toBe('admin');
    expect(testCommand.group).toBe('moderation');
    expect(testCommand.description).toBe('Test command');
    expect(testCommand.examples).toEqual(['example1', 'example2']);
  });

  it('should handle empty registry in listCommands', () => {
    const commands = registry.listCommands();

    expect(commands).toEqual([]);
  });

  it('should handle empty registry in listByGroup', () => {
    const grouped = registry.listByGroup();

    expect(grouped.size).toBe(0);
  });

  it('should register command with options but no handler metadata', () => {
    const handler = jest.fn();
    const options = { category: 'utility' };

    registry.register('util', handler, options);

    const entry = registry.handlers.get('util');
    expect(entry.category).toBe('utility');
    expect(entry.group).toBe('core'); // defaults to core
  });
});
