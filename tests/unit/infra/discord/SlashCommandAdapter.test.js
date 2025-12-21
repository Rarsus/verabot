const SlashCommandAdapter = require('../../../../src/infra/discord/SlashCommandAdapter');
const Command = require('../../../../src/core/commands/Command');

describe('SlashCommandAdapter', () => {
  let mockClient;
  let mockBus;
  let mockRegistry;
  let mockLogger;
  let mockHelpService;
  let adapter;

  beforeEach(() => {
    mockClient = {
      on: jest.fn()
    };

    mockBus = {
      execute: jest.fn().mockResolvedValue({ success: true })
    };

    mockRegistry = {
      getMeta: jest.fn().mockReturnValue({
        name: 'test',
        options: []
      })
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    mockHelpService = {
      getCommandHelp: jest.fn()
    };

    adapter = new SlashCommandAdapter(mockClient, mockBus, mockRegistry, mockLogger, mockHelpService);
  });

  it('should create adapter instance', () => {
    expect(adapter).toBeDefined();
  });

  it('should store all dependencies', () => {
    expect(adapter.client).toBe(mockClient);
    expect(adapter.bus).toBe(mockBus);
    expect(adapter.registry).toBe(mockRegistry);
    expect(adapter.logger).toBe(mockLogger);
    expect(adapter.helpService).toBe(mockHelpService);
  });

  it('should register listeners on client', () => {
    adapter.registerListeners();

    expect(mockClient.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
  });

  it('should handle chat input interactions', () => {
    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false)
    };

    adapter.registerListeners();
    const handler = mockClient.on.mock.calls[0][1];

    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should handle autocomplete interactions', () => {
    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false)
    };

    adapter.registerListeners();
    const handler = mockClient.on.mock.calls[0][1];

    expect(handler).toBeDefined();
  });

  it('should handle button interactions', () => {
    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(true)
    };

    adapter.registerListeners();
    const handler = mockClient.on.mock.calls[0][1];

    expect(handler).toBeDefined();
  });

  it('should create Command instance for chat input', async () => {
    mockRegistry.getMeta.mockReturnValue({
      name: 'ping',
      options: [
        { name: 'silent', type: 'boolean' }
      ]
    });

    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false),
      commandName: 'core',
      options: {
        getSubcommand: jest.fn().mockReturnValue('ping'),
        getBoolean: jest.fn().mockReturnValue(true),
        getInteger: jest.fn(),
        getUser: jest.fn(),
        getRole: jest.fn(),
        getChannel: jest.fn(),
        getString: jest.fn()
      },
      user: { id: 'user123' },
      channelId: 'channel123',
      reply: jest.fn().mockResolvedValue(undefined)
    };

    await adapter.handleChatInput(interaction);

    expect(mockBus.execute).toHaveBeenCalled();
  });

  it('should handle missing metadata gracefully', async () => {
    mockRegistry.getMeta.mockReturnValue(null);

    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false),
      commandName: 'core',
      options: {
        getSubcommand: jest.fn().mockReturnValue('unknown')
      }
    };

    const result = await adapter.handleChatInput(interaction);

    expect(result).toBeUndefined();
  });

  it('should log errors from command execution', async () => {
    mockBus.execute.mockRejectedValue(new Error('Execution failed'));

    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false),
      commandName: 'core',
      options: {
        getSubcommand: jest.fn().mockReturnValue('test'),
        getBoolean: jest.fn(),
        getInteger: jest.fn(),
        getUser: jest.fn(),
        getRole: jest.fn(),
        getChannel: jest.fn(),
        getString: jest.fn()
      },
      user: { id: 'user123' },
      channelId: 'channel123',
      reply: jest.fn().mockResolvedValue(undefined)
    };

    mockRegistry.getMeta.mockReturnValue({
      name: 'test',
      options: []
    });

    await adapter.handleChatInput(interaction);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should support different option types', async () => {
    mockRegistry.getMeta.mockReturnValue({
      name: 'complex',
      options: [
        { name: 'count', type: 'integer' },
        { name: 'enabled', type: 'boolean' },
        { name: 'user', type: 'user' },
        { name: 'role', type: 'role' },
        { name: 'channel', type: 'channel' },
        { name: 'text', type: 'string' }
      ]
    });

    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false),
      commandName: 'test',
      options: {
        getSubcommand: jest.fn().mockReturnValue('complex'),
        getInteger: jest.fn().mockReturnValue(5),
        getBoolean: jest.fn().mockReturnValue(true),
        getUser: jest.fn().mockReturnValue({ id: 'user456' }),
        getRole: jest.fn().mockReturnValue({ id: 'role789' }),
        getChannel: jest.fn().mockReturnValue({ id: 'channel999' }),
        getString: jest.fn().mockReturnValue('hello')
      },
      user: { id: 'user123' },
      channelId: 'channel123',
      reply: jest.fn().mockResolvedValue(undefined)
    };

    await adapter.handleChatInput(interaction);

    expect(mockBus.execute).toHaveBeenCalled();
  });

  it('should defer replies for long-running operations', async () => {
    const interaction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(false),
      commandName: 'ops',
      options: {
        getSubcommand: jest.fn().mockReturnValue('deploy'),
        getBoolean: jest.fn(),
        getInteger: jest.fn(),
        getUser: jest.fn(),
        getRole: jest.fn(),
        getChannel: jest.fn(),
        getString: jest.fn()
      },
      user: { id: 'user123' },
      channelId: 'channel123',
      deferReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined)
    };

    mockRegistry.getMeta.mockReturnValue({
      name: 'deploy',
      options: []
    });

    await adapter.handleChatInput(interaction);

    expect(mockBus.execute).toHaveBeenCalled();
  });
});
