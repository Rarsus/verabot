const { createRepositories } = require('../../../../src/infra/db/Repositories');

describe('Repositories Factory', () => {
  let mockDb;
  let mockLogger;
  let mockPrepare;
  let mockGet;
  let mockAll;
  let mockRun;
  let repositories;

  beforeEach(() => {
    mockGet = jest.fn();
    mockAll = jest.fn();
    mockRun = jest.fn();
    mockPrepare = jest.fn(() => ({
      get: mockGet,
      all: mockAll,
      run: mockRun,
    }));

    mockDb = {
      raw: {
        prepare: mockPrepare,
      },
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    repositories = createRepositories(mockDb, mockLogger);
  });

  describe('CommandRepository', () => {
    const repo = () => repositories.commandRepo;

    describe('isAllowed', () => {
      it('should return true if command is allowed', async () => {
        mockGet.mockReturnValue({ id: 1 });
        const result = await repo().isAllowed('test');
        expect(result).toBe(true);
        expect(mockPrepare).toHaveBeenCalledWith(
          'SELECT 1 FROM allowed_commands WHERE command = ?',
        );
      });

      it('should return false if command is not allowed', async () => {
        mockGet.mockReturnValue(null);
        const result = await repo().isAllowed('test');
        expect(result).toBe(false);
      });
    });

    describe('listAllowed', () => {
      it('should list all allowed commands', async () => {
        const commands = [{ command: 'test1' }, { command: 'test2' }];
        mockAll.mockReturnValue(commands);

        const result = await repo().listAllowed();

        expect(result).toEqual(commands);
        expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM allowed_commands ORDER BY command');
      });

      it('should return empty array if no commands', async () => {
        mockAll.mockReturnValue([]);
        const result = await repo().listAllowed();
        expect(result).toEqual([]);
      });
    });

    describe('addAllowed', () => {
      it('should add a new allowed command', async () => {
        await repo().addAllowed('test', 'user123');

        expect(mockPrepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR IGNORE INTO allowed_commands'),
        );
        expect(mockRun).toHaveBeenCalledWith('test', 'user123');
      });

      it('should ignore duplicate command', async () => {
        await repo().addAllowed('test', 'user123');
        await repo().addAllowed('test', 'user456');

        expect(mockRun).toHaveBeenCalledTimes(2);
      });
    });

    describe('removeAllowed', () => {
      it('should remove command and related permissions', async () => {
        await repo().removeAllowed('test');

        expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM allowed_commands WHERE command = ?');
        expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM command_roles WHERE command = ?');
        expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM command_channels WHERE command = ?');
        expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM command_users WHERE command = ?');
        expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM rate_limits WHERE command = ?');
      });

      it('should run delete for each query', async () => {
        await repo().removeAllowed('test');
        expect(mockRun).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('PermissionRepository', () => {
    const repo = () => repositories.permissionRepo;

    describe('isAllowed', () => {
      it('should check if command is allowed', async () => {
        mockGet.mockReturnValue({ id: 1 });
        const result = await repo().isAllowed('test');
        expect(result).toBe(true);
      });
    });

    describe('getRoles', () => {
      it('should get roles for a command', async () => {
        const roles = [{ role_id: 'role1' }, { role_id: 'role2' }];
        mockAll.mockReturnValue(roles);

        const result = await repo().getRoles('test');

        expect(result).toEqual(['role1', 'role2']);
        expect(mockPrepare).toHaveBeenCalledWith(
          'SELECT role_id FROM command_roles WHERE command = ?',
        );
      });

      it('should return empty array if no roles', async () => {
        mockAll.mockReturnValue([]);
        const result = await repo().getRoles('test');
        expect(result).toEqual([]);
      });
    });

    describe('getChannels', () => {
      it('should get channels for a command', async () => {
        const channels = [{ channel_id: 'ch1' }, { channel_id: 'ch2' }];
        mockAll.mockReturnValue(channels);

        const result = await repo().getChannels('test');

        expect(result).toEqual(['ch1', 'ch2']);
      });
    });

    describe('getUsers', () => {
      it('should get users for a command', async () => {
        const users = [{ user_id: 'user1' }, { user_id: 'user2' }];
        mockAll.mockReturnValue(users);

        const result = await repo().getUsers('test');

        expect(result).toEqual(['user1', 'user2']);
      });
    });

    describe('addRole', () => {
      it('should add role to command', async () => {
        await repo().addRole('test', 'admin');

        expect(mockPrepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR IGNORE INTO command_roles'),
        );
        expect(mockRun).toHaveBeenCalledWith('test', 'admin');
      });
    });

    describe('addChannel', () => {
      it('should add channel to command', async () => {
        await repo().addChannel('test', 'general');

        expect(mockPrepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR IGNORE INTO command_channels'),
        );
        expect(mockRun).toHaveBeenCalledWith('test', 'general');
      });
    });

    describe('addUser', () => {
      it('should add user to command', async () => {
        await repo().addUser('test', 'user123');

        expect(mockPrepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR IGNORE INTO command_users'),
        );
        expect(mockRun).toHaveBeenCalledWith('test', 'user123');
      });
    });

    describe('listAudit', () => {
      it('should list audit log entries', async () => {
        const entries = [{ id: 1, command: 'test' }];
        mockAll.mockReturnValue(entries);

        const result = await repo().listAudit();

        expect(result).toEqual(entries);
        expect(mockPrepare).toHaveBeenCalledWith(
          'SELECT * FROM audit_log ORDER BY id DESC LIMIT ?',
        );
      });

      it('should accept custom limit', async () => {
        mockAll.mockReturnValue([]);
        await repo().listAudit(100);
        expect(mockAll).toHaveBeenCalledWith(100);
      });
    });
  });

  describe('AuditRepository', () => {
    const repo = () => repositories.auditRepo;

    describe('log', () => {
      it('should log command execution', async () => {
        const command = {
          source: 'discord',
          name: 'test',
          userId: 'user123',
          channelId: 'ch123',
          args: ['arg1'],
        };
        const result = { success: true };

        await repo().log(command, result);

        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO audit_log'));
        expect(mockRun).toHaveBeenCalledWith('discord', 'test', 'user123', 'ch123', '["arg1"]', 1);
      });

      it('should log null user and channel if not provided', async () => {
        const command = {
          source: 'ws',
          name: 'test',
          userId: null,
          channelId: null,
          args: [],
        };
        const result = { success: false };

        await repo().log(command, result);

        expect(mockRun).toHaveBeenCalledWith('ws', 'test', null, null, '[]', 0);
      });
    });
  });

  describe('RateLimitRepository', () => {
    const repo = () => repositories.rateLimitRepo;

    describe('getLastUsed', () => {
      it('should get last used timestamp', async () => {
        mockGet.mockReturnValue({ last_used: 123456 });

        const result = await repo().getLastUsed('test');

        expect(result).toBe(123456);
        expect(mockPrepare).toHaveBeenCalledWith(
          'SELECT last_used FROM rate_limits WHERE command = ?',
        );
      });

      it('should return null if no record', async () => {
        mockGet.mockReturnValue(null);
        const result = await repo().getLastUsed('test');
        expect(result).toBe(null);
      });
    });

    describe('setLastUsed', () => {
      it('should set or update last used timestamp', async () => {
        await repo().setLastUsed('test', 123456);

        expect(mockPrepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO rate_limits'),
        );
        expect(mockRun).toHaveBeenCalledWith('test', 123456);
      });
    });
  });

  describe('Factory Function', () => {
    it('should log when creating repositories', () => {
      createRepositories(mockDb, mockLogger);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating repositories');
    });

    it('should return all four repositories', () => {
      expect(repositories).toHaveProperty('commandRepo');
      expect(repositories).toHaveProperty('permissionRepo');
      expect(repositories).toHaveProperty('auditRepo');
      expect(repositories).toHaveProperty('rateLimitRepo');
    });

    it('should create instances with methods', () => {
      expect(typeof repositories.commandRepo.isAllowed).toBe('function');
      expect(typeof repositories.permissionRepo.getRoles).toBe('function');
      expect(typeof repositories.auditRepo.log).toBe('function');
      expect(typeof repositories.rateLimitRepo.getLastUsed).toBe('function');
    });
  });
});
