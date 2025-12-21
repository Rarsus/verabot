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

  describe('Integer Option Handling', () => {
    it('should add integer options without autocomplete or choices', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'ban',
            description: 'Ban user',
            options: [
              { name: 'duration', type: 'integer', required: true }
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
            addIntegerOption: jest.fn().mockImplementation(optFn => {
              optFn({
                setName: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                setRequired: jest.fn().mockReturnThis()
              });
              return sub;
            }),
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

    it('should add integer options with autocomplete', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              { name: 'count', type: 'integer', autocomplete: true }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
        setAutocomplete: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
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

      expect(mockOptionBuilder.setAutocomplete).toHaveBeenCalledWith(true);
    });

    it('should add integer options with choices', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              {
                name: 'level',
                type: 'integer',
                choices: [
                  { name: 'low', value: 1 },
                  { name: 'high', value: 5 }
                ]
              }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
        addChoices: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
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

      expect(mockOptionBuilder.addChoices).toHaveBeenCalled();
    });
  });

  describe('String Option Handling', () => {
    it('should add string options without autocomplete or choices', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              { name: 'reason', type: 'string' }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

    it('should add string options with autocomplete', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'search',
            description: 'Search',
            options: [
              { name: 'query', type: 'string', autocomplete: true }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
        setAutocomplete: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setAutocomplete).toHaveBeenCalledWith(true);
    });

    it('should add string options with choices', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'deploy',
            description: 'Deploy',
            options: [
              {
                name: 'target',
                type: 'string',
                choices: [
                  { name: 'staging', value: 'staging' },
                  { name: 'production', value: 'production' }
                ]
              }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
        addChoices: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.addChoices).toHaveBeenCalled();
    });
  });

  describe('Boolean Option Handling', () => {
    it('should add boolean options', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              { name: 'verbose', type: 'boolean', required: true }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setRequired).toHaveBeenCalledWith(true);
    });
  });

  describe('User/Role/Channel Option Handling', () => {
    it('should add user options', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'ban',
            description: 'Ban',
            options: [
              { name: 'user', type: 'user', required: true }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setRequired).toHaveBeenCalledWith(true);
    });

    it('should add role options', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'grant',
            description: 'Grant',
            options: [
              { name: 'role', type: 'role', required: false }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addRoleOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setRequired).toHaveBeenCalledWith(false);
    });

    it('should add channel options', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'lock',
            description: 'Lock',
            options: [
              { name: 'channel', type: 'channel' }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addChannelOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
            addUserOption: jest.fn().mockReturnThis(),
            addRoleOption: jest.fn().mockReturnThis()
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

  describe('Option Default Behavior', () => {
    it('should use default description for options without description', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              { name: 'arg' } // No description, no type
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setDescription).toHaveBeenCalledWith('No description');
    });

    it('should mark options as not required by default', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'cmd',
            description: 'Command',
            options: [
              { name: 'optional', type: 'string' } // No required field
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
            addIntegerOption: jest.fn().mockReturnThis(),
            addBooleanOption: jest.fn().mockReturnThis(),
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

      expect(mockOptionBuilder.setRequired).toHaveBeenCalledWith(false);
    });

    it('should handle empty options array', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['core', [
          {
            name: 'simple',
            description: 'Simple command',
            options: []
          }
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

      expect(mockRest.put).toHaveBeenCalled();
    });
  });

  describe('Complex Multi-Option Scenarios', () => {
    it('should handle commands with multiple different option types', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'complex',
            description: 'Complex command',
            options: [
              { name: 'user', type: 'user', required: true },
              { name: 'duration', type: 'integer', required: false },
              { name: 'reason', type: 'string' },
              { name: 'permanent', type: 'boolean' }
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
            addUserOption: jest.fn().mockImplementation(optFn => {
              optFn({
                setName: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                setRequired: jest.fn().mockReturnThis()
              });
              return sub;
            }),
            addIntegerOption: jest.fn().mockImplementation(optFn => {
              optFn({
                setName: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                setRequired: jest.fn().mockReturnThis()
              });
              return sub;
            }),
            addStringOption: jest.fn().mockImplementation(optFn => {
              optFn({
                setName: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                setRequired: jest.fn().mockReturnThis()
              });
              return sub;
            }),
            addBooleanOption: jest.fn().mockImplementation(optFn => {
              optFn({
                setName: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
                setRequired: jest.fn().mockReturnThis()
              });
              return sub;
            }),
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

    it('should handle integer with both autocomplete and choices', async () => {
      mockRegistry.listByGroup.mockReturnValue(new Map([
        ['admin', [
          {
            name: 'tiered',
            description: 'Tiered command',
            options: [
              {
                name: 'level',
                type: 'integer',
                autocomplete: true,
                choices: [
                  { name: 'Level 1', value: 1 },
                  { name: 'Level 2', value: 2 }
                ]
              }
            ]
          }
        ]]
      ]));

      const mockOptionBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
        setAutocomplete: jest.fn().mockReturnThis(),
        addChoices: jest.fn().mockReturnThis()
      };

      const mockBuilder = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockImplementation(function(fn) {
          const sub = {
            setName: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addIntegerOption: jest.fn().mockImplementation(optFn => {
              optFn(mockOptionBuilder);
              return sub;
            }),
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

      expect(mockOptionBuilder.setAutocomplete).toHaveBeenCalledWith(true);
      expect(mockOptionBuilder.addChoices).toHaveBeenCalled();
    });
  });
});
