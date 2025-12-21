const Command = require('../../../src/core/commands/Command');

describe('Command', () => {
  it('should create command with required fields', () => {
    const command = new Command({
      name: 'ping',
      source: 'discord',
      userId: 'user123',
      channelId: 'channel456',
    });

    expect(command.name).toBe('ping');
    expect(command.source).toBe('discord');
    expect(command.userId).toBe('user123');
    expect(command.channelId).toBe('channel456');
  });

  it('should initialize args as empty array by default', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
    });

    expect(command.args).toEqual([]);
  });

  it('should initialize metadata as empty object by default', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
    });

    expect(command.metadata).toEqual({});
  });

  it('should accept custom args', () => {
    const command = new Command({
      name: 'say',
      source: 'discord',
      args: ['hello', 'world'],
    });

    expect(command.args).toEqual(['hello', 'world']);
  });

  it('should accept custom metadata', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
      metadata: { priority: 'high', retry: true },
    });

    expect(command.metadata).toEqual({ priority: 'high', retry: true });
  });

  it('should set userId to null if not provided', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
    });

    expect(command.userId).toBeNull();
  });

  it('should set channelId to null if not provided', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
    });

    expect(command.channelId).toBeNull();
  });

  it('should support different sources', () => {
    const sources = ['discord', 'api', 'cli', 'webhook'];

    sources.forEach((source) => {
      const command = new Command({
        name: 'test',
        source,
      });

      expect(command.source).toBe(source);
    });
  });

  it('should preserve all properties when created', () => {
    const props = {
      name: 'admin',
      source: 'discord',
      userId: 'admin123',
      channelId: 'mod-channel',
      args: ['user', 'ban'],
      metadata: { admin: true, timestamp: 123456 },
    };

    const command = new Command(props);

    expect(command.name).toBe(props.name);
    expect(command.source).toBe(props.source);
    expect(command.userId).toBe(props.userId);
    expect(command.channelId).toBe(props.channelId);
    expect(command.args).toEqual(props.args);
    expect(command.metadata).toEqual(props.metadata);
  });

  it('should handle empty args array', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
      args: [],
    });

    expect(command.args).toEqual([]);
  });

  it('should handle undefined args parameter', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
      args: undefined,
    });

    expect(command.args).toEqual([]);
  });

  it('should handle metadata not provided', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
    });

    expect(command.metadata).toEqual({});
  });

  it('should keep userId as null when explicitly set', () => {
    const command = new Command({
      name: 'test',
      source: 'discord',
      userId: null,
    });

    expect(command.userId).toBeNull();
  });
});
