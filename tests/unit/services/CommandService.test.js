const CommandService = require('../../../src/core/services/CommandService');

describe('CommandService', () => {
  let service;
  let mockCommandRepo;

  beforeEach(() => {
    mockCommandRepo = {
      isAllowed: jest.fn(),
      listAllowed: jest.fn(),
      addAllowed: jest.fn(),
      removeAllowed: jest.fn(),
    };
    service = new CommandService(mockCommandRepo);
  });

  describe('isAllowed', () => {
    it('should check if command is allowed', async () => {
      mockCommandRepo.isAllowed.mockResolvedValue(true);

      const result = await service.isAllowed('ping');

      expect(result).toBe(true);
      expect(mockCommandRepo.isAllowed).toHaveBeenCalledWith('ping');
    });

    it('should return false for disallowed commands', async () => {
      mockCommandRepo.isAllowed.mockResolvedValue(false);

      const result = await service.isAllowed('banned');

      expect(result).toBe(false);
    });
  });

  describe('listAllowed', () => {
    it('should list all allowed commands', async () => {
      const allowedCommands = ['ping', 'help', 'info'];
      mockCommandRepo.listAllowed.mockResolvedValue(allowedCommands);

      const result = await service.listAllowed();

      expect(result).toEqual(allowedCommands);
      expect(mockCommandRepo.listAllowed).toHaveBeenCalled();
    });

    it('should return empty array if no commands allowed', async () => {
      mockCommandRepo.listAllowed.mockResolvedValue([]);

      const result = await service.listAllowed();

      expect(result).toEqual([]);
    });
  });

  describe('addAllowed', () => {
    it('should add a command to allowed list', async () => {
      mockCommandRepo.addAllowed.mockResolvedValue({ added: true });

      const result = await service.addAllowed('newcmd', 'admin');

      expect(result).toEqual({ added: true });
      expect(mockCommandRepo.addAllowed).toHaveBeenCalledWith('newcmd', 'admin');
    });

    it('should handle duplicate command errors', async () => {
      const error = new Error('Command already exists');
      mockCommandRepo.addAllowed.mockRejectedValue(error);

      await expect(service.addAllowed('ping', 'admin')).rejects.toThrow('Command already exists');
    });
  });

  describe('removeAllowed', () => {
    it('should remove a command from allowed list', async () => {
      mockCommandRepo.removeAllowed.mockResolvedValue({ removed: true });

      const result = await service.removeAllowed('badcmd');

      expect(result).toEqual({ removed: true });
      expect(mockCommandRepo.removeAllowed).toHaveBeenCalledWith('badcmd');
    });

    it('should handle non-existent command errors', async () => {
      const error = new Error('Command not found');
      mockCommandRepo.removeAllowed.mockRejectedValue(error);

      await expect(service.removeAllowed('nonexistent')).rejects.toThrow('Command not found');
    });
  });
});
