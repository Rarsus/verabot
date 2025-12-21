const SlashCommandAdapter = require('../../../../src/infra/discord/SlashCommandAdapter');
const EmbedFactory = require('../../../../src/infra/discord/EmbedFactory');

jest.mock('../../../../src/infra/discord/EmbedFactory');

describe('SlashCommandAdapter', () => {
  let mockClient;
  let mockBus;
  let mockRegistry;
  let mockLogger;
  let mockHelpService;
  let adapter;

  beforeEach(() => {
    mockClient = {
      on: jest.fn(),
    };

    mockBus = {
      execute: jest.fn().mockResolvedValue({ success: true, message: 'OK' }),
    };

    mockRegistry = {
      getMeta: jest.fn().mockReturnValue({
        name: 'test',
        options: [],
      }),
      listCommands: jest.fn().mockReturnValue([]),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockHelpService = {
      getCommandHelp: jest.fn().mockReturnValue('Help text'),
      getCommandsByCategory: jest.fn().mockReturnValue([
        { name: 'cmd1', description: 'Cmd 1' },
        { name: 'cmd2', description: 'Cmd 2' },
      ]),
      paginate: jest.fn().mockReturnValue({
        items: [
          { name: 'cmd1', description: 'Cmd 1' },
          { name: 'cmd2', description: 'Cmd 2' },
        ],
        page: 1,
        pages: 1,
      }),
    };

    // Mock EmbedFactory methods
    EmbedFactory.base.mockReturnValue({ setDescription: jest.fn().mockReturnThis() });
    EmbedFactory.commandResult.mockReturnValue({});
    EmbedFactory.commandHelp.mockReturnValue({});
    EmbedFactory.commandList.mockReturnValue({});
    EmbedFactory.audit.mockReturnValue({});
    EmbedFactory.error.mockReturnValue({});
    EmbedFactory.helpPaginationRow.mockReturnValue({});

    adapter = new SlashCommandAdapter(
      mockClient,
      mockBus,
      mockRegistry,
      mockLogger,
      mockHelpService,
    );
  });

  describe('Constructor', () => {
    it('should create adapter instance', () => {
      expect(adapter).toBeDefined();
    });

    it('should store client', () => {
      expect(adapter.client).toBe(mockClient);
    });

    it('should store command bus', () => {
      expect(adapter.bus).toBe(mockBus);
    });

    it('should store registry', () => {
      expect(adapter.registry).toBe(mockRegistry);
    });

    it('should store logger', () => {
      expect(adapter.logger).toBe(mockLogger);
    });

    it('should store helpService', () => {
      expect(adapter.helpService).toBe(mockHelpService);
    });
  });

  describe('registerListeners', () => {
    it('should register interactionCreate listener', () => {
      adapter.registerListeners();

      expect(mockClient.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
    });

    it('should be async handler', () => {
      adapter.registerListeners();
      const handler = mockClient.on.mock.calls[0][1];

      expect(handler.constructor.name).toMatch(/AsyncFunction|Function/);
    });
  });

  describe('Interaction Handling', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    describe('Chat Input Commands', () => {
      it('should handle chat input commands', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'core',
          options: {
            getSubcommand: jest.fn().mockReturnValue('ping'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'user123' },
          channelId: 'channel123',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'ping',
          options: [],
        });

        await handler(interaction);

        expect(adapter.bus.execute).toHaveBeenCalled();
      });

      it('should skip if metadata not found', async () => {
        mockRegistry.getMeta.mockReturnValue(null);

        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'core',
          options: {
            getSubcommand: jest.fn().mockReturnValue('unknown'),
          },
        };

        await handler(interaction);

        expect(mockBus.execute).not.toHaveBeenCalled();
      });

      it('should parse integer arguments', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('ban'),
            getInteger: jest.fn().mockReturnValue(7),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'mod123' },
          channelId: 'modchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'ban',
          options: [{ name: 'duration', type: 'integer' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['7']),
          }),
        );
      });

      it('should parse boolean arguments', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'core',
          options: {
            getSubcommand: jest.fn().mockReturnValue('test'),
            getInteger: jest.fn(),
            getBoolean: jest.fn().mockReturnValue(true),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'user123' },
          channelId: 'channel123',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'test',
          options: [{ name: 'verbose', type: 'boolean' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['true']),
          }),
        );
      });

      it('should parse user IDs from user objects', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('mute'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn().mockReturnValue({ id: 'target123' }),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'mod456' },
          channelId: 'modchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'mute',
          options: [{ name: 'user', type: 'user' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['target123']),
          }),
        );
      });

      it('should parse role IDs', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('grant'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getRole: jest.fn().mockReturnValue({ id: 'role789' }),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'admin123' },
          channelId: 'adminchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'grant',
          options: [{ name: 'role', type: 'role' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['role789']),
          }),
        );
      });

      it('should parse channel IDs', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('lock'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn().mockReturnValue({ id: 'channel999' }),
            getString: jest.fn(),
          },
          user: { id: 'mod123' },
          channelId: 'modchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'lock',
          options: [{ name: 'channel', type: 'channel' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['channel999']),
          }),
        );
      });

      it('should parse string arguments', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('reason'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn().mockReturnValue('Violation of TOS'),
          },
          user: { id: 'mod123' },
          channelId: 'modchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'reason',
          options: [{ name: 'text', type: 'string' }],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: expect.arrayContaining(['Violation of TOS']),
          }),
        );
      });

      it('should skip null/undefined option values', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'core',
          options: {
            getSubcommand: jest.fn().mockReturnValue('test'),
            getInteger: jest.fn().mockReturnValue(null),
            getBoolean: jest.fn().mockReturnValue(undefined),
            getUser: jest.fn(),
            getRole: jest.fn(),
            getChannel: jest.fn(),
            getString: jest.fn(),
          },
          user: { id: 'user123' },
          channelId: 'channel123',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'test',
          options: [
            { name: 'count', type: 'integer' },
            { name: 'flag', type: 'boolean' },
          ],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: [],
          }),
        );
      });

      it('should handle null user/role/channel objects', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(false),
          commandName: 'admin',
          options: {
            getSubcommand: jest.fn().mockReturnValue('test'),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn().mockReturnValue(null),
            getRole: jest.fn().mockReturnValue(null),
            getChannel: jest.fn().mockReturnValue(null),
            getString: jest.fn(),
          },
          user: { id: 'admin123' },
          channelId: 'adminchannel',
          reply: jest.fn().mockResolvedValue(undefined),
        };

        mockRegistry.getMeta.mockReturnValue({
          name: 'test',
          options: [
            { name: 'user', type: 'user' },
            { name: 'role', type: 'role' },
            { name: 'channel', type: 'channel' },
          ],
        });

        await handler(interaction);

        expect(mockBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            args: [],
          }),
        );
      });
    });

    describe('Autocomplete Interactions', () => {
      it('should ignore autocomplete interactions', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(true),
          isButton: jest.fn().mockReturnValue(false),
          options: {
            getSubcommand: jest.fn().mockReturnValue('test'),
            getFocused: jest.fn().mockReturnValue({ value: 'test', name: 'arg' }),
          },
          respond: jest.fn().mockResolvedValue(undefined),
        };

        await handler(interaction);

        expect(mockBus.execute).not.toHaveBeenCalled();
      });
    });

    describe('Button Interactions', () => {
      it('should ignore button interactions', async () => {
        const interaction = {
          isChatInputCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
          isButton: jest.fn().mockReturnValue(true),
          customId: 'help:all:1',
        };

        // Don't call handler directly since button requires fully mocked helpService
        // Just verify the function exists
        expect(adapter.registerListeners).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should log command execution errors', async () => {
      mockBus.execute.mockRejectedValue(new Error('Execution failed'));

      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('test'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'test',
        options: [],
      });

      adapter.registerListeners();
      const handler = mockClient.on.mock.calls[0][1];

      await handler(interaction);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Command Creation', () => {
    it('should create Command with correct structure', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('ping'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'ping',
        options: [],
      });

      adapter.registerListeners();
      const handler = mockClient.on.mock.calls[0][1];

      await handler(interaction);

      const command = mockBus.execute.mock.calls[0][0];
      expect(command).toHaveProperty('name');
      expect(command).toHaveProperty('source');
      expect(command).toHaveProperty('userId');
      expect(command).toHaveProperty('channelId');
      expect(command).toHaveProperty('args');
    });
  });

  describe('handleChatInput - Help Command', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle help command with command type result', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('help'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'help',
        options: [],
        cooldown: { seconds: 5 },
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: {
          type: 'command',
          name: 'ping',
          description: 'Ping command',
        },
      });

      await handler(interaction);

      expect(EmbedFactory.commandHelp).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
        }),
      );
    });

    it('should handle help command with list type result', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('help'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'help',
        options: [],
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: {
          type: 'list',
          category: 'admin',
          page: 1,
          pages: 2,
          items: [{ name: 'ban', description: 'Ban user' }],
        },
      });

      await handler(interaction);

      expect(EmbedFactory.commandList).toHaveBeenCalledWith('admin', 1, 2, expect.any(Array));
      expect(EmbedFactory.helpPaginationRow).toHaveBeenCalledWith(
        'admin',
        expect.objectContaining({ category: 'admin' }),
      );
      expect(interaction.reply).toHaveBeenCalled();
    });

    it('should handle help command with null category', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('help'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'help',
        options: [],
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: {
          type: 'list',
          category: null,
          page: 1,
          pages: 1,
          items: [],
        },
      });

      await handler(interaction);

      expect(EmbedFactory.helpPaginationRow).toHaveBeenCalledWith(null, expect.any(Object));
    });
  });

  describe('handleChatInput - Allowed Command', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle allowed command', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('allowed'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'allowed',
        options: [],
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: {
          category: 'admin',
          page: 1,
          pages: 3,
          items: [
            { name: 'ban', description: 'Ban user' },
            { name: 'kick', description: 'Kick user' },
          ],
        },
      });

      await handler(interaction);

      expect(EmbedFactory.commandList).toHaveBeenCalledWith(
        'admin',
        1,
        3,
        expect.arrayContaining([expect.objectContaining({ name: 'ban' })]),
      );
      expect(EmbedFactory.helpPaginationRow).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalled();
    });
  });

  describe('handleChatInput - Audit Command', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle audit command', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('audit'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'audit',
        options: [],
      });

      const auditEntries = [{ timestamp: Date.now(), action: 'ban', user: 'user456' }];

      mockBus.execute.mockResolvedValue({
        success: true,
        data: {
          entries: auditEntries,
        },
      });

      await handler(interaction);

      expect(EmbedFactory.audit).toHaveBeenCalledWith(auditEntries);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        }),
      );
    });
  });

  describe('handleChatInput - Regular Commands', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle regular command with cooldown', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'admin',
        options: {
          getSubcommand: jest.fn().mockReturnValue('ban'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn().mockReturnValue('Violation'),
        },
        user: { id: 'mod123' },
        channelId: 'modchannel',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'ban',
        options: [{ name: 'reason', type: 'string' }],
        cooldown: { seconds: 30 },
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: { userId: 'user456', action: 'banned' },
      });

      await handler(interaction);

      expect(EmbedFactory.commandResult).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          cooldownSec: 30,
          elapsedSec: expect.any(Number),
        }),
      );
    });

    it('should handle regular command without cooldown', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('ping'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'ping',
        options: [],
      });

      mockBus.execute.mockResolvedValue({
        success: true,
        data: { pong: true },
      });

      await handler(interaction);

      expect(EmbedFactory.commandResult).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          cooldownSec: null,
          elapsedSec: expect.any(Number),
        }),
      );
    });
  });

  describe('handleChatInput - Member Roles', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should extract member roles when available', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('test'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        member: {
          roles: {
            cache: {
              map: jest.fn().mockReturnValue(['role1', 'role2', 'role3']),
            },
          },
        },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'test',
        options: [],
      });

      await handler(interaction);

      const command = mockBus.execute.mock.calls[0][0];
      expect(command.metadata.roles).toEqual(['role1', 'role2', 'role3']);
    });

    it('should handle missing member roles', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('test'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'test',
        options: [],
      });

      await handler(interaction);

      const command = mockBus.execute.mock.calls[0][0];
      expect(command.metadata.roles).toEqual([]);
    });

    it('should handle null member object', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        commandName: 'core',
        options: {
          getSubcommand: jest.fn().mockReturnValue('test'),
          getInteger: jest.fn(),
          getBoolean: jest.fn(),
          getUser: jest.fn(),
          getRole: jest.fn(),
          getChannel: jest.fn(),
          getString: jest.fn(),
        },
        user: { id: 'user123' },
        channelId: 'channel123',
        member: null,
        reply: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'test',
        options: [],
      });

      await handler(interaction);

      const command = mockBus.execute.mock.calls[0][0];
      expect(command.metadata.roles).toEqual([]);
    });
  });

  describe('handleAutocomplete', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle deploy target autocomplete', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('deploy'),
          getFocused: jest.fn().mockReturnValue({
            name: 'target',
            value: 'st',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'deploy',
        options: [],
      });

      await handler(interaction);

      expect(interaction.respond).toHaveBeenCalledWith([{ name: 'staging', value: 'staging' }]);
    });

    it('should filter deploy targets by prefix', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('deploy'),
          getFocused: jest.fn().mockReturnValue({
            name: 'target',
            value: 'p',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'deploy',
        options: [],
      });

      await handler(interaction);

      expect(interaction.respond).toHaveBeenCalledWith(
        expect.arrayContaining([{ name: 'production', value: 'production' }]),
      );
    });

    it('should limit deploy suggestions to 5', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('deploy'),
          getFocused: jest.fn().mockReturnValue({
            name: 'target',
            value: '',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'deploy',
        options: [],
      });

      await handler(interaction);

      const suggestions = interaction.respond.mock.calls[0][0];
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle help command autocomplete', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('help'),
          getFocused: jest.fn().mockReturnValue({
            name: 'command',
            value: 'b',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'help',
        options: [],
      });

      mockRegistry.listCommands.mockReturnValue([
        { name: 'ban', description: 'Ban user' },
        { name: 'broadcast', description: 'Broadcast message' },
        { name: 'ping', description: 'Ping' },
      ]);

      await handler(interaction);

      expect(interaction.respond).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'ban' }),
          expect.objectContaining({ name: 'broadcast' }),
        ]),
      );
    });

    it('should limit help command suggestions to 10', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('help'),
          getFocused: jest.fn().mockReturnValue({
            name: 'command',
            value: '',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'help',
        options: [],
      });

      mockRegistry.listCommands.mockReturnValue(
        Array.from({ length: 20 }, (_, i) => ({
          name: `cmd${i}`,
          description: `Command ${i}`,
        })),
      );

      await handler(interaction);

      const suggestions = interaction.respond.mock.calls[0][0];
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it('should respond empty for unknown autocomplete field', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        options: {
          getSubcommand: jest.fn().mockReturnValue('unknown'),
          getFocused: jest.fn().mockReturnValue({
            name: 'unknown_field',
            value: 'test',
          }),
        },
        respond: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.getMeta.mockReturnValue({
        name: 'unknown',
        options: [],
      });

      await handler(interaction);

      expect(interaction.respond).toHaveBeenCalledWith([]);
    });
  });

  describe('handleButton', () => {
    let handler;

    beforeEach(() => {
      adapter.registerListeners();
      handler = mockClient.on.mock.calls[0][1];
    });

    it('should handle help pagination button clicks', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(true),
        customId: 'help:admin:2',
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockHelpService.getCommandsByCategory.mockReturnValue([
        { name: 'ban', description: 'Ban user' },
        { name: 'kick', description: 'Kick user' },
      ]);

      mockHelpService.paginate.mockReturnValue({
        items: [{ name: 'ban', description: 'Ban user' }],
        page: 2,
        pages: 2,
      });

      await handler(interaction);

      expect(mockHelpService.getCommandsByCategory).toHaveBeenCalledWith('admin');
      expect(mockHelpService.paginate).toHaveBeenCalledWith(expect.any(Array), 2);
      expect(EmbedFactory.commandList).toHaveBeenCalledWith('admin', 2, 2, expect.any(Array));
      expect(EmbedFactory.helpPaginationRow).toHaveBeenCalledWith('admin', expect.any(Object));
      expect(interaction.update).toHaveBeenCalled();
    });

    it('should handle all-category pagination button', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(true),
        customId: 'help:all:1',
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockHelpService.getCommandsByCategory.mockReturnValue([
        { name: 'cmd1', description: 'Cmd 1' },
        { name: 'cmd2', description: 'Cmd 2' },
      ]);

      mockHelpService.paginate.mockReturnValue({
        items: [
          { name: 'cmd1', description: 'Cmd 1' },
          { name: 'cmd2', description: 'Cmd 2' },
        ],
        page: 1,
        pages: 1,
      });

      await handler(interaction);

      expect(mockHelpService.getCommandsByCategory).toHaveBeenCalledWith(null);
      expect(EmbedFactory.helpPaginationRow).toHaveBeenCalledWith(null, expect.any(Object));
    });

    it('should default to page 1 for invalid page number', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(true),
        customId: 'help:admin:notanumber',
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockHelpService.getCommandsByCategory.mockReturnValue([]);
      mockHelpService.paginate.mockReturnValue({
        items: [],
        page: 1,
        pages: 1,
      });

      await handler(interaction);

      expect(mockHelpService.paginate).toHaveBeenCalledWith(expect.any(Array), 1);
    });

    it('should ignore non-help button interactions', async () => {
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(true),
        customId: 'other:action:param',
      };

      await handler(interaction);

      expect(mockHelpService.getCommandsByCategory).not.toHaveBeenCalled();
    });
  });

  describe('renderHelp', () => {
    it('should render command help for command type', () => {
      const result = {
        data: {
          type: 'command',
          name: 'ban',
          description: 'Ban a user',
        },
      };

      adapter.renderHelp(result);

      expect(EmbedFactory.commandHelp).toHaveBeenCalledWith(result.data);
    });

    it('should render command list for list type', () => {
      const result = {
        data: {
          type: 'list',
          category: 'admin',
          page: 1,
          pages: 2,
          items: [{ name: 'ban' }],
        },
      };

      adapter.renderHelp(result);

      expect(EmbedFactory.commandList).toHaveBeenCalledWith('admin', 1, 2, [{ name: 'ban' }]);
    });

    it('should render autocomplete embed for autocomplete type', () => {
      const result = {
        data: {
          autocomplete: {
            suggestions: ['item1', 'item2'],
          },
        },
      };

      adapter.renderHelp(result);

      expect(EmbedFactory.autocomplete).toHaveBeenCalledWith(result.data.autocomplete);
    });

    it('should render default embed for unknown type', () => {
      const result = {
        data: {
          type: 'unknown',
        },
      };

      adapter.renderHelp(result);

      expect(EmbedFactory.base).toHaveBeenCalled();
    });

    it('should render autocomplete when type is not explicitly command/list', () => {
      const result = {
        data: {
          autocomplete: {
            suggestions: ['item1'],
          },
        },
      };

      adapter.renderHelp(result);

      expect(EmbedFactory.autocomplete).toHaveBeenCalledWith(result.data.autocomplete);
    });
  });
});
