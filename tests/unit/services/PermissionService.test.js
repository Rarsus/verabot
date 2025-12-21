const PermissionService = require('../../../src/core/services/PermissionService');

describe('PermissionService', () => {
  let service;
  let mockPermissionRepo;
  let mockCategoryPolicy;

  beforeEach(() => {
    mockPermissionRepo = {
      isAllowed: jest.fn(),
      getRoles: jest.fn(),
      getChannels: jest.fn(),
      getUsers: jest.fn(),
    };
    mockCategoryPolicy = jest.fn();
    service = new PermissionService(mockPermissionRepo, mockCategoryPolicy);
  });

  describe('canExecute without category policy', () => {
    beforeEach(() => {
      service = new PermissionService(mockPermissionRepo);
      mockPermissionRepo.isAllowed.mockResolvedValue(true);
      mockPermissionRepo.getRoles.mockResolvedValue([]);
      mockPermissionRepo.getChannels.mockResolvedValue([]);
      mockPermissionRepo.getUsers.mockResolvedValue([]);
    });

    it('should allow execution if command is allowed and no restrictions', async () => {
      const command = { name: 'ping', userId: '123', channelId: 'ch1', metadata: {} };

      const result = await service.canExecute(command);

      expect(result).toBe(true);
    });

    it('should deny execution if command is not allowed', async () => {
      mockPermissionRepo.isAllowed.mockResolvedValue(false);
      const command = { name: 'banned', userId: '123', channelId: 'ch1' };

      const result = await service.canExecute(command);

      expect(result).toBe(false);
    });

    it('should deny if user not in allowed users list', async () => {
      mockPermissionRepo.getUsers.mockResolvedValue(['user1', 'user2']);
      const command = { name: 'restricted', userId: 'user3', channelId: 'ch1', metadata: {} };

      const result = await service.canExecute(command);

      expect(result).toBe(false);
    });

    it('should allow if user is in allowed users list', async () => {
      mockPermissionRepo.getUsers.mockResolvedValue(['user1', 'user2']);
      const command = { name: 'restricted', userId: 'user1', channelId: 'ch1', metadata: {} };

      const result = await service.canExecute(command);

      expect(result).toBe(true);
    });

    it('should deny if channel not in allowed channels', async () => {
      mockPermissionRepo.getChannels.mockResolvedValue(['ch1', 'ch2']);
      const command = { name: 'restricted', userId: '123', channelId: 'ch3', metadata: {} };

      const result = await service.canExecute(command);

      expect(result).toBe(false);
    });

    it('should deny if user lacks required role', async () => {
      mockPermissionRepo.getRoles.mockResolvedValue(['admin', 'mod']);
      const command = {
        name: 'restricted',
        userId: '123',
        channelId: 'ch1',
        metadata: { roles: ['user'] },
      };

      const result = await service.canExecute(command);

      expect(result).toBe(false);
    });

    it('should allow if user has one of required roles', async () => {
      mockPermissionRepo.getRoles.mockResolvedValue(['admin', 'mod']);
      const command = {
        name: 'restricted',
        userId: '123',
        channelId: 'ch1',
        metadata: { roles: ['user', 'mod'] },
      };

      const result = await service.canExecute(command);

      expect(result).toBe(true);
    });
  });

  describe('canExecute with category policy', () => {
    it('should deny if category policy returns false', async () => {
      mockCategoryPolicy.mockResolvedValue(false);
      mockPermissionRepo.isAllowed.mockResolvedValue(true);
      const command = { name: 'ping', userId: '123', channelId: 'ch1', metadata: {} };

      const result = await service.canExecute(command, 'blocked-category');

      expect(result).toBe(false);
      expect(mockCategoryPolicy).toHaveBeenCalledWith('blocked-category', command);
    });

    it('should continue checks if category policy returns true', async () => {
      mockCategoryPolicy.mockResolvedValue(true);
      mockPermissionRepo.isAllowed.mockResolvedValue(true);
      mockPermissionRepo.getRoles.mockResolvedValue([]);
      mockPermissionRepo.getChannels.mockResolvedValue([]);
      mockPermissionRepo.getUsers.mockResolvedValue([]);
      const command = { name: 'ping', userId: '123', channelId: 'ch1', metadata: {} };

      const result = await service.canExecute(command, 'admin');

      expect(result).toBe(true);
    });
  });
});
