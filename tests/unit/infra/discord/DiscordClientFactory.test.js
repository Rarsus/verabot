const { createDiscordClient } = require('../../../../src/infra/discord/DiscordClientFactory');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

jest.mock('discord.js', () => ({
  Client: jest.fn(),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 512,
    MessageContent: 32768,
  },
  Partials: {
    Channel: 1,
  },
}));

describe('DiscordClientFactory', () => {
  let mockConfig;
  let mockLogger;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      DISCORD_TOKEN: 'test-token-12345',
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockClient = {
      once: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      login: jest.fn().mockResolvedValue('test-token-12345'),
      user: {
        tag: 'TestBot#1234',
      },
    };

    Client.mockImplementation(() => mockClient);
  });

  describe('createDiscordClient', () => {
    it('should create a Discord client', () => {
      const client = createDiscordClient(mockConfig, mockLogger);

      expect(Client).toHaveBeenCalled();
      expect(client).toBeDefined();
    });

    it('should return the client instance', () => {
      const client = createDiscordClient(mockConfig, mockLogger);

      expect(client).toBe(mockClient);
    });

    it('should create client with correct intents', () => {
      createDiscordClient(mockConfig, mockLogger);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          intents: expect.arrayContaining([
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
          ]),
        })
      );
    });

    it('should include Guilds intent', () => {
      createDiscordClient(mockConfig, mockLogger);

      const call = Client.mock.calls[0][0];
      expect(call.intents).toContain(GatewayIntentBits.Guilds);
    });

    it('should include GuildMessages intent', () => {
      createDiscordClient(mockConfig, mockLogger);

      const call = Client.mock.calls[0][0];
      expect(call.intents).toContain(GatewayIntentBits.GuildMessages);
    });

    it('should include MessageContent intent', () => {
      createDiscordClient(mockConfig, mockLogger);

      const call = Client.mock.calls[0][0];
      expect(call.intents).toContain(GatewayIntentBits.MessageContent);
    });

    it('should configure Channel partial', () => {
      createDiscordClient(mockConfig, mockLogger);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          partials: expect.arrayContaining([Partials.Channel]),
        })
      );
    });

    it('should register ready event listener', () => {
      createDiscordClient(mockConfig, mockLogger);

      expect(mockClient.once).toHaveBeenCalledWith('ready', expect.any(Function));
    });

    it('should log when client is ready', () => {
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      readyHandler();

      expect(mockLogger.info).toHaveBeenCalledWith(
        { user: 'TestBot#1234' },
        'Discord client ready'
      );
    });

    it('should use client user tag in ready log', () => {
      mockClient.user.tag = 'MyBot#5678';
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      readyHandler();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'MyBot#5678' }),
        'Discord client ready'
      );
    });
  });

  describe('Client Configuration', () => {
    it('should create client with intents array', () => {
      createDiscordClient(mockConfig, mockLogger);

      const config = Client.mock.calls[0][0];
      expect(Array.isArray(config.intents)).toBe(true);
    });

    it('should create client with partials array', () => {
      createDiscordClient(mockConfig, mockLogger);

      const config = Client.mock.calls[0][0];
      expect(Array.isArray(config.partials)).toBe(true);
    });

    it('should configure exactly three intents', () => {
      createDiscordClient(mockConfig, mockLogger);

      const config = Client.mock.calls[0][0];
      expect(config.intents).toHaveLength(3);
    });

    it('should configure exactly one partial', () => {
      createDiscordClient(mockConfig, mockLogger);

      const config = Client.mock.calls[0][0];
      expect(config.partials).toHaveLength(1);
    });
  });

  describe('Ready Event Handler', () => {
    it('should call logger with user info', () => {
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      readyHandler();

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should call ready listener with no arguments', () => {
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      expect(() => readyHandler()).not.toThrow();
    });

    it('should log "Discord client ready" message', () => {
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      readyHandler();

      const call = mockLogger.info.mock.calls[0];
      expect(call[1]).toBe('Discord client ready');
    });

    it('should handle multiple ready event triggering', () => {
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];

      readyHandler();
      readyHandler();

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Export', () => {
    it('should export createDiscordClient function', () => {
      expect(typeof createDiscordClient).toBe('function');
    });

    it('should have correct function signature', () => {
      expect(createDiscordClient.length).toBe(2);
    });
  });

  describe('Multiple Client Instances', () => {
    it('should create independent client instances', () => {
      const client1 = createDiscordClient(mockConfig, mockLogger);

      mockClient = {
        once: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        login: jest.fn().mockResolvedValue('test-token-12345'),
        user: { tag: 'SecondBot#9999' },
      };
      Client.mockImplementation(() => mockClient);

      const client2 = createDiscordClient(mockConfig, mockLogger);

      expect(client1).not.toBe(client2);
    });

    it('should create multiple clients with same config', () => {
      createDiscordClient(mockConfig, mockLogger);
      createDiscordClient(mockConfig, mockLogger);

      expect(Client).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null user in ready handler', () => {
      mockClient.user = null;
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];

      expect(() => readyHandler()).toThrow();
    });

    it('should handle null tag in user object', () => {
      mockClient.user.tag = null;
      createDiscordClient(mockConfig, mockLogger);

      const readyHandler = mockClient.once.mock.calls[0][1];
      readyHandler();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ user: null }),
        expect.any(String)
      );
    });
  });
});
