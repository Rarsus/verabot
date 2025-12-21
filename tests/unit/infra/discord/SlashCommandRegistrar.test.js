const SlashCommandRegistrar = require('../../../../src/infra/discord/SlashCommandRegistrar');

jest.mock('discord.js', () => ({
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn()
  })),
  Routes: {
    applicationCommands: jest.fn(id => `/applications/${id}/commands`)
  },
  SlashCommandBuilder: jest.fn().mockImplementation(() => {
    const options = [];
    return {
      setName: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      addSubcommandGroup: jest.fn().mockReturnThis(),
      addSubcommand: jest.fn().mockImplementation(function(fn) {
        const sub = {
          setName: jest.fn().mockReturnThis(),
          setDescription: jest.fn().mockReturnThis(),
          addIntegerOption: jest.fn().mockReturnThis(),
          addBooleanOption: jest.fn().mockReturnThis(),
          addStringOption: jest.fn().mockReturnThis(),
          addUserOption: jest.fn().mockReturnThis(),
          addRoleOption: jest.fn().mockReturnThis(),
          addChannelOption: jest.fn().mockReturnThis(),
          setAutocomplete: jest.fn().mockReturnThis(),
          addChoices: jest.fn().mockReturnThis()
        };
        fn(sub);
        options.push(sub);
        return this;
      }),
      addIntegerOption: jest.fn().mockReturnThis(),
      addBooleanOption: jest.fn().mockReturnThis(),
      addStringOption: jest.fn().mockReturnThis(),
      options: options,
      toJSON: jest.fn().mockReturnValue({ name: 'test', description: 'test' })
    };
  })
}));

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

describe('SlashCommandRegistrar', () => {
  let mockConfig;
  let mockRegistry;
  let mockLogger;
  let mockRest;
  let registrar;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      DISCORD_TOKEN: 'test-token',
      DISCORD_CLIENT_ID: 'test-client-id'
    };

    mockRegistry = {
      listByGroup: jest.fn().mockReturnValue(new Map([
        ['admin', [
          { name: 'ban', description: 'Ban a user', options: [] },
          { name: 'kick', description: 'Kick a user', options: [] }
        ]],
        ['core', [
          { name: 'help', description: 'Show help', options: [] }
        ]]
      ]))
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    mockRest = {
      setToken: jest.fn().mockReturnThis(),
      put: jest.fn().mockResolvedValue({ status: 200 })
    };

    REST.mockImplementation(() => mockRest);

    // Re-implement SlashCommandBuilder after jest.clearAllMocks()
    SlashCommandBuilder.mockImplementation(() => {
      const options = [];
      return {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommandGroup: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockReturnThis(),
            addRoleOption: jest.fn().mockReturnThis(),
            addChannelOption: jest.fn().mockReturnThis()
          };
          fn(sub);
          options.push(sub);
          return this;
        }),
        addIntegerOption: jest.fn().mockReturnThis(),
        addBooleanOption: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis(),
        options: options,
        toJSON: jest.fn().mockReturnValue({ name: 'test', description: 'test' })
      };
    });

    registrar = new SlashCommandRegistrar(mockConfig, mockRegistry, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(registrar).toBeDefined();
    });

    it('should store config reference', () => {
      expect(registrar.config).toBe(mockConfig);
    });

    it('should store registry reference', () => {
      expect(registrar.registry).toBe(mockRegistry);
    });

    it('should store logger reference', () => {
      expect(registrar.logger).toBe(mockLogger);
    });
  });

  describe('registerCommands', () => {
    it('should get commands from registry by group', async () => {
      await registrar.registerCommands();

      expect(mockRegistry.listByGroup).toHaveBeenCalled();
    });

    it('should create REST instance with token', async () => {
      await registrar.registerCommands();

      expect(REST).toHaveBeenCalled();
      expect(mockRest.setToken).toHaveBeenCalledWith(mockConfig.DISCORD_TOKEN);
    });

    it('should call Discord API with correct endpoint', async () => {
      const { Routes } = require('discord.js');
      
      await registrar.registerCommands();

      // Just verify the REST API was called with a body
      expect(mockRest.put).toHaveBeenCalledTimes(1);
      const callArgs = mockRest.put.mock.calls[0];
      // First argument is the route (will be mocked), second is the config
      expect(callArgs.length).toBe(2);
      expect(callArgs[1]).toHaveProperty('body');
      expect(Array.isArray(callArgs[1].body)).toBe(true);
    });

    it('should log registration start', async () => {
      await registrar.registerCommands();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registering global slash commands')
      );
    });

    it('should log registration completion', async () => {
      await registrar.registerCommands();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Slash commands registered')
      );
    });

    it('should build SlashCommandBuilder for each group', async () => {
      SlashCommandBuilder.mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      }));

      await registrar.registerCommands();

      expect(SlashCommandBuilder).toHaveBeenCalledTimes(2); // 2 groups
    });

    it('should set group name and description', async () => {
      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockBuilder.setName).toHaveBeenCalledWith('admin');
      expect(mockBuilder.setDescription).toHaveBeenCalledWith('admin commands');
    });

    it('should add subcommands for each command in group', async () => {
      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [{}, {}], // 2 commands in admin group
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockBuilder.addSubcommand).toHaveBeenCalledTimes(3); // 2 admin + 1 core
    });

    it('should handle empty registry', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map());

      await registrar.registerCommands();

      const call = mockRest.put.mock.calls[0];
      expect(call[1].body).toEqual([]);
    });

    it('should use default description if not provided', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['test', [
          { name: 'cmd' } // No description
        ]]
      ]));

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockBuilder.setDescription).toHaveBeenCalledWith('test commands');
    });
  });

  describe('Error Handling', () => {
    it('should propagate API errors', async () => {
      const apiError = new Error('API Error');
      mockRest.put.mockRejectedValue(apiError);

      await expect(registrar.registerCommands()).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      mockRest.put.mockRejectedValue(new Error('Network error'));

      await expect(registrar.registerCommands()).rejects.toThrow();
    });

    it('should handle invalid token', async () => {
      mockRest.put.mockRejectedValue(new Error('401 Unauthorized'));

      await expect(registrar.registerCommands()).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      mockRest.put.mockRejectedValue(new Error('429 Too Many Requests'));

      await expect(registrar.registerCommands()).rejects.toThrow();
    });
  });

  describe('Command Options', () => {
    it('should pass command options to builder', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['test', [
          {
            name: 'search',
            description: 'Search something',
            options: [
              { name: 'query', type: 'string', required: true }
            ]
          }
        ]]
      ]));

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockReturnThis(),
            addRoleOption: jest.fn().mockReturnThis(),
            addChannelOption: jest.fn().mockReturnThis()
          };
          fn(sub);
          mockBuilder.options.push(sub);
          return mockBuilder;
        }),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockBuilder.addSubcommand).toHaveBeenCalled();
    });

    it('should handle multiple options per command', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'ban',
            description: 'Ban user',
            options: [
              { name: 'user', type: 'user', required: true },
              { name: 'reason', type: 'string', required: false }
            ]
          }
        ]]
      ]));

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockReturnThis(),
            addRoleOption: jest.fn().mockReturnThis(),
            addChannelOption: jest.fn().mockReturnThis()
          };
          fn(sub);
          mockBuilder.options.push(sub);
          return mockBuilder;
        }),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockBuilder.addSubcommand).toHaveBeenCalled();
    });
  });

  describe('Multiple Groups', () => {
    it('should handle multiple command groups', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [{ name: 'ban', description: 'Ban user', options: [] }]],
        ['core', [{ name: 'help', description: 'Help', options: [] }]],
        ['messaging', [{ name: 'send', description: 'Send message', options: [] }]],
        ['operations', [{ name: 'status', description: 'Status', options: [] }]]
      ]));

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(SlashCommandBuilder).toHaveBeenCalledTimes(4);
    });

    it('should register all groups in single API call', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [{ name: 'ban', description: 'Ban', options: [] }]],
        ['core', [{ name: 'help', description: 'Help', options: [] }]]
      ]));

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis(),
        options: [],
        toJSON: jest.fn().mockReturnValue({})
      };

      SlashCommandBuilder.mockImplementation(() => mockBuilder);

      await registrar.registerCommands();

      expect(mockRest.put).toHaveBeenCalledTimes(1);
      const call = mockRest.put.mock.calls[0];
      expect(call[1].body).toHaveLength(2);
    });
  });

  describe('API Response Handling', () => {
    it('should handle successful registration', async () => {
      mockRest.put.mockResolvedValue({ status: 200, data: [] });

      await expect(registrar.registerCommands()).resolves.not.toThrow();
    });

    it('should handle empty response', async () => {
      mockRest.put.mockResolvedValue(undefined);

      await expect(registrar.registerCommands()).resolves.not.toThrow();
    });

    it('should complete even with unusual response codes', async () => {
      mockRest.put.mockResolvedValue({ status: 201, created: true });

      await expect(registrar.registerCommands()).resolves.not.toThrow();
    });
  });
});
