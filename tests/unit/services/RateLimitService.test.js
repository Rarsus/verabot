const RateLimitService = require('../../../src/core/services/RateLimitService');
const RateLimitError = require('../../../src/core/errors/RateLimitError');

describe('RateLimitService', () => {
  let service;
  let mockRateLimitRepo;

  beforeEach(() => {
    mockRateLimitRepo = {
      getLastUsed: jest.fn(),
      setLastUsed: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('with default cooldowns', () => {
    beforeEach(() => {
      service = new RateLimitService(mockRateLimitRepo, 3000);
    });

    it('should allow core commands immediately without rate limit (cooldown 0)', async () => {
      const result = await service.tryConsume({ name: 'ping' }, 'core');
      expect(result).toBe(true);
      // Core has 0 cooldown, so getLastUsed/setLastUsed not called
      expect(mockRateLimitRepo.getLastUsed).not.toHaveBeenCalled();
    });

    it('should allow admin commands immediately without rate limit (cooldown 0)', async () => {
      const result = await service.tryConsume({ name: 'allow' }, 'admin');
      expect(result).toBe(true);
      expect(mockRateLimitRepo.getLastUsed).not.toHaveBeenCalled();
    });

    it('should allow command first time when never used (messaging)', async () => {
      mockRateLimitRepo.getLastUsed.mockResolvedValue(null);

      const result = await service.tryConsume({ name: 'say' }, 'messaging');

      expect(result).toBe(true);
      expect(mockRateLimitRepo.getLastUsed).toHaveBeenCalledWith('say');
      expect(mockRateLimitRepo.setLastUsed).toHaveBeenCalledWith('say', expect.any(Number));
    });

    it('should reject command when cooldown not met (messaging)', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 1000); // Only 1s ago

      await expect(service.tryConsume({ name: 'say' }, 'messaging')).rejects.toThrow(
        RateLimitError,
      );
      expect(mockRateLimitRepo.setLastUsed).not.toHaveBeenCalled();
    });

    it('should allow command when cooldown is met (messaging 3000ms)', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 3000); // Exactly 3s ago

      const result = await service.tryConsume({ name: 'say' }, 'messaging');

      expect(result).toBe(true);
      expect(mockRateLimitRepo.setLastUsed).toHaveBeenCalledWith('say', expect.any(Number));
    });

    it('should reject operations command when cooldown not met (10000ms)', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 5000); // Only 5s ago

      await expect(service.tryConsume({ name: 'deploy' }, 'operations')).rejects.toThrow(
        RateLimitError,
      );
    });

    it('should allow operations command when cooldown is met (10000ms)', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 10000); // Exactly 10s ago

      const result = await service.tryConsume({ name: 'deploy' }, 'operations');

      expect(result).toBe(true);
      expect(mockRateLimitRepo.setLastUsed).toHaveBeenCalled();
    });
  });

  describe('with custom category cooldowns', () => {
    beforeEach(() => {
      service = new RateLimitService(mockRateLimitRepo, 3000, {
        custom: 5000,
      });
    });

    it('should use custom category cooldown', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 4000); // 4s ago

      await expect(service.tryConsume({ name: 'cmd' }, 'custom')).rejects.toThrow(RateLimitError);
    });

    it('should allow after custom cooldown is met', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 5000); // 5s ago

      const result = await service.tryConsume({ name: 'cmd' }, 'custom');

      expect(result).toBe(true);
    });

    it('should preserve default category cooldowns', () => {
      expect(service.categoryCooldowns.core).toBe(0);
      expect(service.categoryCooldowns.messaging).toBe(3000);
      expect(service.categoryCooldowns.operations).toBe(10000);
      expect(service.categoryCooldowns.custom).toBe(5000);
    });
  });

  describe('boundary conditions', () => {
    beforeEach(() => {
      service = new RateLimitService(mockRateLimitRepo, 1000, { test: 1000 });
    });

    it('should allow exactly at cooldown boundary (1000ms)', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 1000); // Exactly 1s ago

      const result = await service.tryConsume({ name: 'test' }, 'test');

      expect(result).toBe(true);
    });

    it('should allow 1ms after cooldown', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 1001); // 1s + 1ms ago

      const result = await service.tryConsume({ name: 'test' }, 'test');

      expect(result).toBe(true);
    });

    it('should reject 1ms before cooldown', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 999); // 1ms before cooldown

      await expect(service.tryConsume({ name: 'test' }, 'test')).rejects.toThrow(RateLimitError);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      service = new RateLimitService(mockRateLimitRepo, 3000);
    });

    it('should propagate repo getLastUsed errors', async () => {
      mockRateLimitRepo.getLastUsed.mockRejectedValue(new Error('DB error'));

      await expect(service.tryConsume({ name: 'test' }, 'messaging')).rejects.toThrow('DB error');
    });

    it('should propagate repo setLastUsed errors', async () => {
      mockRateLimitRepo.getLastUsed.mockResolvedValue(null);
      mockRateLimitRepo.setLastUsed.mockRejectedValue(new Error('Write failed'));

      await expect(service.tryConsume({ name: 'test' }, 'messaging')).rejects.toThrow(
        'Write failed',
      );
    });

    it('should throw RateLimitError for rate limit violations', async () => {
      mockRateLimitRepo.getLastUsed.mockResolvedValue(Date.now());

      await expect(service.tryConsume({ name: 'test' }, 'messaging')).rejects.toThrow(
        RateLimitError,
      );
    });
  });

  describe('constructor', () => {
    it('should accept custom category cooldowns', () => {
      const customCooldowns = { test: 1000 };
      const svc = new RateLimitService(mockRateLimitRepo, 3000, customCooldowns);

      expect(svc.categoryCooldowns.test).toBe(1000);
    });

    it('should merge custom with default cooldowns', () => {
      const customCooldowns = { test: 1000, custom2: 5000 };
      const svc = new RateLimitService(mockRateLimitRepo, 3000, customCooldowns);

      expect(svc.categoryCooldowns.core).toBe(0);
      expect(svc.categoryCooldowns.messaging).toBe(3000);
      expect(svc.categoryCooldowns.test).toBe(1000);
      expect(svc.categoryCooldowns.custom2).toBe(5000);
    });

    it('should override default cooldowns with custom ones', () => {
      const customCooldowns = { messaging: 5000 };
      const svc = new RateLimitService(mockRateLimitRepo, 3000, customCooldowns);

      expect(svc.categoryCooldowns.messaging).toBe(5000);
    });

    it('should store default cooldown value', () => {
      const svc = new RateLimitService(mockRateLimitRepo, 5000);

      expect(svc.defaultCooldownMs).toBe(5000);
    });
  });

  describe('unknown categories', () => {
    beforeEach(() => {
      service = new RateLimitService(mockRateLimitRepo, 2000);
    });

    it('should use default cooldown for unknown category', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 1000); // 1s ago

      // unknown category should use defaultCooldownMs of 2000
      await expect(service.tryConsume({ name: 'cmd' }, 'unknown')).rejects.toThrow(RateLimitError);
    });

    it('should use default cooldown when cooldown is 2000ms', async () => {
      const now = Date.now();
      mockRateLimitRepo.getLastUsed.mockResolvedValue(now - 2000); // 2s ago

      const result = await service.tryConsume({ name: 'cmd' }, 'unknown');

      expect(result).toBe(true);
    });
  });
});
