const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedFactory = require('../../../../src/infra/discord/EmbedFactory');

jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn(),
  ActionRowBuilder: jest.fn(),
  ButtonBuilder: jest.fn(),
  ButtonStyle: {
    Secondary: 2,
    Primary: 1,
    Danger: 4,
  },
}));

describe('EmbedFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    EmbedBuilder.mockImplementation(() => ({
      setColor: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setFooter: jest.fn().mockReturnThis(),
      setFields: jest.fn().mockReturnThis(),
      addFields: jest.fn().mockReturnThis(),
    }));

    ButtonBuilder.mockImplementation(() => ({
      setCustomId: jest.fn().mockReturnThis(),
      setLabel: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      setDisabled: jest.fn().mockReturnThis(),
    }));

    ActionRowBuilder.mockImplementation(() => ({
      addComponents: jest.fn().mockReturnThis(),
    }));
  });

  describe('base', () => {
    it('should create base embed with color', () => {
      const embed = EmbedFactory.base();

      expect(EmbedBuilder).toHaveBeenCalled();
      expect(embed.setColor).toHaveBeenCalledWith(0x2b6cb0);
    });

    it('should add timestamp to base embed', () => {
      const embed = EmbedFactory.base();

      expect(embed.setTimestamp).toHaveBeenCalled();
    });
  });

  describe('commandResult', () => {
    it('should create result embed for successful command', () => {
      const command = { name: 'ping' };
      const result = {
        success: true,
        data: { message: 'Pong!' },
      };

      const embed = EmbedFactory.commandResult(command, result);

      expect(embed.setTitle).toHaveBeenCalledWith('✅ ping');
      expect(embed.setDescription).toHaveBeenCalledWith('Pong!');
    });

    it('should create result embed for failed command', () => {
      const command = { name: 'test' };
      const result = {
        success: false,
        error: { message: 'Permission denied' },
      };

      const embed = EmbedFactory.commandResult(command, result);

      expect(embed.setTitle).toHaveBeenCalledWith('✅ test');
      expect(embed.setDescription).toHaveBeenCalledWith('Permission denied');
    });

    it('should include elapsed time in footer', () => {
      const command = { name: 'analyze' };
      const result = { success: true, data: {} };

      const embed = EmbedFactory.commandResult(command, result, { elapsedSec: 1.234 });

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('took 1.23s'),
      });
    });

    it('should include cooldown in footer', () => {
      const command = { name: 'ban' };
      const result = { success: true, data: {} };

      const embed = EmbedFactory.commandResult(command, result, { cooldownSec: 30 });

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('cooldown 30s'),
      });
    });

    it('should include both elapsed time and cooldown', () => {
      const command = { name: 'deploy' };
      const result = { success: true, data: {} };

      const embed = EmbedFactory.commandResult(command, result, {
        elapsedSec: 2.5,
        cooldownSec: 10,
      });

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('took 2.50s'),
      });
      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('cooldown 10s'),
      });
    });

    it('should use default message for missing data', () => {
      const command = { name: 'test' };
      const result = { success: true };

      const embed = EmbedFactory.commandResult(command, result);

      expect(embed.setDescription).toHaveBeenCalledWith('Success.');
    });

    it('should use default error message', () => {
      const command = { name: 'test' };
      const result = { success: false };

      const embed = EmbedFactory.commandResult(command, result);

      expect(embed.setDescription).toHaveBeenCalledWith('Failed.');
    });
  });

  describe('error', () => {
    it('should create error embed with command name', () => {
      const command = { name: 'ban' };
      const error = new Error('User not found');

      const embed = EmbedFactory.error(command, error);

      expect(embed.setTitle).toHaveBeenCalledWith('❌ ban');
    });

    it('should include error message in description', () => {
      const command = { name: 'kick' };
      const error = new Error('Permission denied');

      const embed = EmbedFactory.error(command, error);

      expect(embed.setDescription).toHaveBeenCalledWith('Error: Permission denied');
    });

    it('should set error color to red', () => {
      const command = { name: 'test' };
      const error = new Error('Test error');

      const embed = EmbedFactory.error(command, error);

      expect(embed.setColor).toHaveBeenCalledWith(0xc53030);
    });
  });

  describe('commandHelp', () => {
    it('should create help embed with command name', () => {
      const meta = {
        name: 'ban',
        description: 'Ban a user from the server',
        category: 'admin',
        usage: 'ban <user> [reason]',
        examples: ['ban @user', 'ban @user spamming'],
      };

      const embed = EmbedFactory.commandHelp(meta);

      expect(embed.setTitle).toHaveBeenCalledWith('📘 Command: ban');
    });

    it('should include command description', () => {
      const meta = {
        name: 'test',
        description: 'Test command',
        category: 'core',
        usage: 'test',
        examples: [],
      };

      const embed = EmbedFactory.commandHelp(meta);

      expect(embed.setDescription).toHaveBeenCalledWith('Test command');
    });

    it('should add category and usage fields', () => {
      const meta = {
        name: 'kick',
        description: 'Kick a user',
        category: 'admin',
        usage: 'kick <user>',
        examples: [],
      };

      const embed = EmbedFactory.commandHelp(meta);

      expect(embed.addFields).toHaveBeenCalledWith(
        { name: 'Category', value: 'admin', inline: true },
        { name: 'Usage', value: '`kick <user>`', inline: true },
      );
    });

    it('should add examples field', () => {
      const meta = {
        name: 'ban',
        description: 'Ban user',
        category: 'admin',
        usage: 'ban <user>',
        examples: ['ban @user', 'ban @user reason'],
      };

      const embed = EmbedFactory.commandHelp(meta);

      expect(embed.addFields).toHaveBeenCalledWith({
        name: 'Examples',
        value: expect.stringContaining('• `ban @user`'),
      });
    });

    it('should handle empty examples list', () => {
      const meta = {
        name: 'test',
        description: 'Test',
        category: 'core',
        usage: 'test',
        examples: [],
      };

      const embed = EmbedFactory.commandHelp(meta);

      expect(embed.addFields).toHaveBeenCalledWith({
        name: 'Examples',
        value: 'None',
      });
    });
  });

  describe('commandList', () => {
    it('should create list with category title', () => {
      const embed = EmbedFactory.commandList('admin', 1, 2, []);

      expect(embed.setTitle).toHaveBeenCalledWith('📂 Commands in category: admin');
    });

    it('should create list with all commands title when no category', () => {
      const embed = EmbedFactory.commandList(null, 1, 1, []);

      expect(embed.setTitle).toHaveBeenCalledWith('📚 All Commands');
    });

    it('should add pagination footer', () => {
      const embed = EmbedFactory.commandList('core', 2, 5, []);

      expect(embed.setFooter).toHaveBeenCalledWith({ text: 'Page 2 of 5' });
    });

    it('should show no commands message when empty', () => {
      const embed = EmbedFactory.commandList('admin', 1, 1, []);

      expect(embed.setDescription).toHaveBeenCalledWith('No commands found.');
    });

    it('should add command fields for non-empty list', () => {
      const items = [
        { name: 'ban', description: 'Ban a user' },
        { name: 'kick', description: 'Kick a user' },
      ];

      const embed = EmbedFactory.commandList('admin', 1, 1, items);

      expect(embed.addFields).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'ban',
            value: 'Ban a user',
            inline: false,
          }),
          expect.objectContaining({
            name: 'kick',
            value: 'Kick a user',
            inline: false,
          }),
        ]),
      );
    });

    it('should handle single command in list', () => {
      const items = [{ name: 'ping', description: 'Ping the bot' }];

      const embed = EmbedFactory.commandList('core', 1, 1, items);

      expect(embed.addFields).toHaveBeenCalled();
    });
  });

  describe('autocomplete', () => {
    it('should create autocomplete embed', () => {
      const embed = EmbedFactory.autocomplete([]);

      expect(embed.setTitle).toHaveBeenCalledWith('🔍 Suggestions');
    });

    it('should show suggestions when available', () => {
      const suggestions = ['ban', 'banlist', 'banned'];

      const embed = EmbedFactory.autocomplete(suggestions);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('• `ban`'));
    });

    it('should show all suggestions', () => {
      const suggestions = ['user1', 'user2', 'user3'];

      const embed = EmbedFactory.autocomplete(suggestions);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringMatching(/user1/));
      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringMatching(/user2/));
      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringMatching(/user3/));
    });

    it('should show no suggestions message when empty', () => {
      const embed = EmbedFactory.autocomplete([]);

      expect(embed.setDescription).toHaveBeenCalledWith('No suggestions found.');
    });
  });

  describe('helpPaginationRow', () => {
    it('should create action row with buttons', () => {
      EmbedFactory.helpPaginationRow('admin', { page: 1, pages: 3 });

      expect(ActionRowBuilder).toHaveBeenCalled();
    });

    it('should create two buttons', () => {
      EmbedFactory.helpPaginationRow('admin', { page: 1, pages: 3 });

      expect(ButtonBuilder).toHaveBeenCalledTimes(2);
    });

    it('should return ActionRowBuilder instance', () => {
      const mockActionRow = { addComponents: jest.fn().mockReturnThis() };
      ActionRowBuilder.mockImplementation(() => mockActionRow);

      const result = EmbedFactory.helpPaginationRow('admin', { page: 1, pages: 3 });

      expect(result).toBe(mockActionRow);
    });

    it('should call addComponents', () => {
      const mockActionRow = { addComponents: jest.fn().mockReturnThis() };
      ActionRowBuilder.mockImplementation(() => mockActionRow);

      EmbedFactory.helpPaginationRow('admin', { page: 1, pages: 3 });

      expect(mockActionRow.addComponents).toHaveBeenCalled();
    });

    it('should handle first page pagination', () => {
      const mockButton = {
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis(),
      };
      ButtonBuilder.mockImplementation(() => mockButton);

      EmbedFactory.helpPaginationRow('admin', { page: 1, pages: 3 });

      // First button should be disabled on page 1 (no previous page)
      expect(mockButton.setDisabled).toHaveBeenCalled();
    });

    it('should handle middle page pagination', () => {
      const mockButton = {
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis(),
      };
      ButtonBuilder.mockImplementation(() => mockButton);

      EmbedFactory.helpPaginationRow('admin', { page: 2, pages: 5 });

      expect(mockButton.setCustomId).toHaveBeenCalledWith(expect.stringContaining('admin'));
    });

    it('should handle last page pagination', () => {
      const mockButton = {
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis(),
      };
      ButtonBuilder.mockImplementation(() => mockButton);

      EmbedFactory.helpPaginationRow('admin', { page: 3, pages: 3 });

      expect(mockButton.setDisabled).toHaveBeenCalled();
    });

    it('should use all category when null', () => {
      const mockButton = {
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis(),
      };
      ButtonBuilder.mockImplementation(() => mockButton);

      EmbedFactory.helpPaginationRow(null, { page: 1, pages: 2 });

      expect(mockButton.setCustomId).toHaveBeenCalledWith(expect.stringContaining('all'));
    });
  });

  describe('audit', () => {
    it('should create audit log embed', () => {
      const embed = EmbedFactory.audit([]);

      expect(embed.setTitle).toHaveBeenCalledWith('📝 Audit Log');
    });

    it('should show audit entries when available', () => {
      const entries = [
        {
          timestamp: '2025-01-01 10:00:00',
          command: 'ban',
          user: 'admin#1234',
          success: true,
        },
        {
          timestamp: '2025-01-01 10:05:00',
          command: 'kick',
          user: 'moderator#5678',
          success: false,
        },
      ];

      const embed = EmbedFactory.audit(entries);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('ban'));
    });

    it('should show success checkmark for successful commands', () => {
      const entries = [
        {
          timestamp: '2025-01-01 10:00:00',
          command: 'ban',
          user: 'admin#1234',
          success: true,
        },
      ];

      const embed = EmbedFactory.audit(entries);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('✅'));
    });

    it('should show failure mark for failed commands', () => {
      const entries = [
        {
          timestamp: '2025-01-01 10:00:00',
          command: 'ban',
          user: 'admin#1234',
          success: false,
        },
      ];

      const embed = EmbedFactory.audit(entries);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('❌'));
    });

    it('should show no entries message when empty', () => {
      const embed = EmbedFactory.audit([]);

      expect(embed.setDescription).toHaveBeenCalledWith('No audit entries.');
    });

    it('should list multiple audit entries', () => {
      const entries = [
        {
          timestamp: '2025-01-01 10:00:00',
          command: 'ban',
          user: 'admin#1234',
          success: true,
        },
        {
          timestamp: '2025-01-01 10:05:00',
          command: 'kick',
          user: 'mod#5678',
          success: true,
        },
        {
          timestamp: '2025-01-01 10:10:00',
          command: 'warn',
          user: 'mod#9012',
          success: false,
        },
      ];

      const embed = EmbedFactory.audit(entries);

      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('ban'));
      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('kick'));
      expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining('warn'));
    });
  });

  describe('embed building chain', () => {
    it('should return chainable embed object', () => {
      const embed = EmbedFactory.base();

      expect(embed.setColor).toHaveBeenCalled();
      expect(embed.setTimestamp).toHaveBeenCalled();
    });

    it('should allow further customization after creation', () => {
      const embed = EmbedFactory.base();

      // Should be able to chain more methods
      embed.addFields?.();

      expect(embed).toBeDefined();
    });
  });
});
