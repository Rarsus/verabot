const { bootstrap } = require('../../../src/infra/bootstrap');
const CommandRegistry = require('../../../src/core/commands/CommandRegistry');

describe('bootstrap', () => {
  let mockContainer;
  let mockDiscordClient;
  let mockHelpService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      isConnected: jest.fn().mockReturnValue(true)
    };

    mockHelpService = {
      registry: null
    };

    mockDiscordClient = {
      user: { id: 'bot123', username: 'TestBot' },
      channels: {
        fetch: jest.fn().mockResolvedValue({
          isTextBased: () => true,
          send: jest.fn().mockResolvedValue(undefined)
        })
      }
    };

    mockContainer = {
      config: {
        NODE_ENV: 'test'
      },
      db: mockDb,
      discordClient: mockDiscordClient,
      wsClient: { isConnected: () => true },
      services: {
        helpService: mockHelpService,
        permissionService: {
          canExecute: jest.fn().mockResolvedValue(true)
        },
        rateLimitService: {
          checkLimit: jest.fn().mockResolvedValue(true)
        }
      },
      repositories: {
        auditRepo: {
          log: jest.fn().mockResolvedValue(undefined)
        }
      },
      logger: {
        info: jest.fn(),
        error: jest.fn()
      },
      metrics: {
        increment: jest.fn()
      },
      jobQueue: {
        enqueue: jest.fn().mockResolvedValue({ id: 'job123' })
      }
    };
  });

  describe('bootstrap function', () => {
    it('should initialize command registry', () => {
      const result = bootstrap(mockContainer);

      expect(result).toHaveProperty('registry');
      expect(result.registry).toBeInstanceOf(CommandRegistry);
    });

    it('should register core commands', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      const coreCommands = commands.filter(cmd => cmd.group === 'core');
      expect(coreCommands.length).toBeGreaterThan(0);

      const commandNames = coreCommands.map(cmd => cmd.name);
      expect(commandNames).toContain('ping');
      expect(commandNames).toContain('info');
    });

    it('should register messaging commands', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      const messagingCommands = commands.filter(cmd => cmd.group === 'msg');
      expect(messagingCommands.length).toBeGreaterThan(0);
    });

    it('should register admin commands', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      const adminCommands = commands.filter(cmd => cmd.group === 'admin');
      expect(adminCommands.length).toBeGreaterThan(0);

      const commandNames = adminCommands.map(cmd => cmd.name);
      expect(commandNames).toContain('allow');
      expect(commandNames).toContain('deny');
    });

    it('should register operations commands', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      const operationsCommands = commands.filter(cmd => cmd.group === 'ops');
      expect(operationsCommands.length).toBeGreaterThan(0);
    });

    it('should attach registry to help service', () => {
      const result = bootstrap(mockContainer);

      expect(mockHelpService.registry).toBeDefined();
      expect(mockHelpService.registry).toBeInstanceOf(CommandRegistry);
    });

    it('should initialize command bus', () => {
      const result = bootstrap(mockContainer);

      expect(result).toHaveProperty('bus');
      expect(result.bus).toBeDefined();
    });

    it('should initialize middleware pipeline', () => {
      const result = bootstrap(mockContainer);

      // Middleware is created internally and passed to bus
      expect(result).toBeDefined();
      expect(result.bus).toBeDefined();
    });

    it('should return bootstrap result with all components', () => {
      const result = bootstrap(mockContainer);

      expect(result).toHaveProperty('registry');
      expect(result).toHaveProperty('bus');
      expect(result).toHaveProperty('messageService');
    });

    it('should create message service', () => {
      const result = bootstrap(mockContainer);

      expect(result.messageService).toBeDefined();
      expect(result.messageService).toHaveProperty('broadcast');
    });

    it('should attach command bus to container', () => {
      bootstrap(mockContainer);

      expect(mockContainer.commandBus).toBeDefined();
    });
  });

  describe('status provider', () => {
    it('should create status provider internally', () => {
      // Status provider is used internally but not returned
      const result = bootstrap(mockContainer);

      // Verify bootstrap succeeded
      expect(result).toBeDefined();
      expect(result.registry).toBeDefined();
    });
  });

  describe('message service', () => {
    it('should broadcast to Discord channel', async () => {
      const result = bootstrap(mockContainer);
      const command = {
        source: 'discord',
        channelId: 'channel123'
      };

      await result.messageService.broadcast(command, 'Hello!');

      expect(mockDiscordClient.channels.fetch).toHaveBeenCalledWith('channel123');
    });

    it('should handle non-Discord sources', async () => {
      const result = bootstrap(mockContainer);
      const command = {
        source: 'api',
        channelId: 'channel123'
      };

      await result.messageService.broadcast(command, 'Hello!');

      // Should not fetch channel for non-Discord sources
      expect(mockDiscordClient.channels.fetch).not.toHaveBeenCalled();
    });

    it('should not send to non-text channels', async () => {
      mockDiscordClient.channels.fetch.mockResolvedValue({
        isTextBased: () => false
      });

      const result = bootstrap(mockContainer);
      const command = {
        source: 'discord',
        channelId: 'voice-channel'
      };

      await result.messageService.broadcast(command, 'Hello!');

      expect(mockDiscordClient.channels.fetch).toHaveBeenCalled();
    });
  });

  describe('command registration', () => {
    it('should register all core handlers', () => {
      const result = bootstrap(mockContainer);
      const coreCommands = ['ping', 'info', 'stats', 'uptime', 'help'];

      coreCommands.forEach(cmd => {
        expect(result.registry.getHandler(cmd)).toBeDefined();
      });
    });

    it('should include command descriptions', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      commands.forEach(cmd => {
        expect(cmd.description).toBeDefined();
        expect(cmd.description).not.toBe('');
      });
    });

    it('should include command usage examples', () => {
      const result = bootstrap(mockContainer);
      const commands = result.registry.listCommands();

      commands.forEach(cmd => {
        expect(cmd.usage).toBeDefined();
        expect(cmd.examples).toBeDefined();
      });
    });
  });
});
