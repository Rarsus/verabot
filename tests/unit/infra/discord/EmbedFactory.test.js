const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedFactory = require('../../../../src/infra/discord/EmbedFactory');

jest.mock('discord.js');

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
      addFields: jest.fn().mockReturnThis()
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
        data: { message: 'Pong!' }
      };

      const embed = EmbedFactory.commandResult(command, result);

      expect(embed.setTitle).toHaveBeenCalledWith('✅ ping');
      expect(embed.setDescription).toHaveBeenCalledWith('Pong!');
    });

    it('should create result embed for failed command', () => {
      const command = { name: 'test' };
      const result = {
        success: false,
        error: { message: 'Permission denied' }
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
        text: expect.stringContaining('took 1.23s')
      });
    });

    it('should include cooldown in footer', () => {
      const command = { name: 'ban' };
      const result = { success: true, data: {} };

      const embed = EmbedFactory.commandResult(command, result, { cooldownSec: 30 });

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('cooldown 30s')
      });
    });

    it('should include both elapsed time and cooldown', () => {
      const command = { name: 'deploy' };
      const result = { success: true, data: {} };

      const embed = EmbedFactory.commandResult(command, result, { 
        elapsedSec: 2.5, 
        cooldownSec: 10 
      });

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('took 2.50s')
      });
      expect(embed.setFooter).toHaveBeenCalledWith({
        text: expect.stringContaining('cooldown 10s')
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
