const PerchanceService = require('../../../src/core/services/PerchanceService');

describe('PerchanceService', () => {
  let perchanceService;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      PERCHANCE_DARE_GENERATOR: 'dare-generator',
      DARE_CACHE_ENABLED: true,
      DARE_CACHE_TTL: 3600,
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    perchanceService = new PerchanceService(mockConfig, mockLogger);

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  describe('generateDare', () => {
    it('should generate dare from Perchance API', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Test dare from API' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await perchanceService.generateDare('dare-generator', 'general');

      expect(result).toBe('Test dare from API');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://perchance.org/api1/dare-generator?theme=general',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'VeraBot/1.0',
          }),
        }),
      );
    });

    it('should handle plain text response', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
        text: jest.fn().mockResolvedValue('Plain text dare'),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await perchanceService.generateDare('dare-generator');

      expect(result).toBe('Plain text dare');
    });

    it('should handle different JSON response formats', async () => {
      const formats = ['result', 'output', 'text', 'dare', 'content'];

      for (const format of formats) {
        const mockResponse = {
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue({ [format]: 'Test dare' }),
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await perchanceService.generateDare('dare-generator');
        expect(result).toBe('Test dare');
      }
    });

    it('should cache generated dares when enabled', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Cached dare' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      // First call should fetch from API
      const result1 = await perchanceService.generateDare('dare-generator', 'general');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe('Cached dare');

      // Second call should use cache
      const result2 = await perchanceService.generateDare('dare-generator', 'general');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, no new call
      expect(result2).toBe('Cached dare');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ generatorName: 'dare-generator', theme: 'general' }),
        'Returning cached dare',
      );
    });

    it('should not cache when caching is disabled', async () => {
      perchanceService.config.DARE_CACHE_ENABLED = false;

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Non-cached dare' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await perchanceService.generateDare('dare-generator');
      await perchanceService.generateDare('dare-generator');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on API failure', async () => {
      const failResponse = {
        ok: false,
        status: 500,
      };
      const successResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Success after retry' }),
      };

      global.fetch.mockResolvedValueOnce(failResponse).mockResolvedValueOnce(successResponse);

      const result = await perchanceService.generateDare('dare-generator');

      expect(result).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should throw error after max retries', async () => {
      const failResponse = {
        ok: false,
        status: 500,
      };
      global.fetch.mockResolvedValue(failResponse);

      await expect(perchanceService.generateDare('dare-generator')).rejects.toThrow(
        'Failed to generate dare from Perchance API after 2 attempts',
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw error on timeout', async () => {
      global.fetch.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      await expect(perchanceService.generateDare('dare-generator')).rejects.toThrow(
        'Failed to generate dare from Perchance API',
      );
    });

    it('should throw error on empty response', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
        text: jest.fn().mockResolvedValue(''),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(perchanceService.generateDare('dare-generator')).rejects.toThrow(
        'Failed to generate dare from Perchance API',
      );
    });

    it('should throw error on unexpected JSON format', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ unexpected: 'format' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(perchanceService.generateDare('dare-generator')).rejects.toThrow(
        'Failed to generate dare from Perchance API',
      );
    });
  });

  describe('clearCache', () => {
    it('should clear all cached dares', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Cached dare' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      // Add something to cache
      await perchanceService.generateDare('dare-generator');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      perchanceService.clearCache();

      // Next call should fetch again
      await perchanceService.generateDare('dare-generator');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Perchance dare cache cleared');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Test' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await perchanceService.generateDare('dare-generator', 'general');
      await perchanceService.generateDare('dare-generator', 'sexy');

      const stats = perchanceService.getCacheStats();

      expect(stats).toEqual({
        size: 2,
        enabled: true,
        ttl: 3600,
      });
    });
  });

  describe('cache expiration', () => {
    it('should not use expired cache entries', async () => {
      // Set very short TTL
      perchanceService.config.DARE_CACHE_TTL = 0.001; // 1 millisecond

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ result: 'Fresh dare' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      // First call
      await perchanceService.generateDare('dare-generator');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second call should fetch again due to expired cache
      await perchanceService.generateDare('dare-generator');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
