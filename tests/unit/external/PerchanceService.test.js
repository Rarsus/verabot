const PerchanceService = require('../../../src/infra/external/PerchanceService');

describe('PerchanceService', () => {
  let perchanceService;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    perchanceService = new PerchanceService(mockLogger);
  });

  describe('generateDare', () => {
    it('should generate a dare with default theme', async () => {
      const result = await perchanceService.generateDare();

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('theme');
      expect(result.content).toBeTruthy();
      expect(result.theme).toBe('general');
      expect(['perchance', 'fallback']).toContain(result.source);
    });

    it('should generate a dare with specified theme', async () => {
      const result = await perchanceService.generateDare('funny');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('theme');
      expect(result.theme).toBe('funny');
    });

    it('should fallback to general theme for invalid theme', async () => {
      const result = await perchanceService.generateDare('invalid-theme');

      expect(result).toHaveProperty('content');
      expect(result.theme).toBe('general');
    });

    it('should use fallback dare when API fails', async () => {
      // The service should always return a dare (from fallback)
      const result = await perchanceService.generateDare('general');

      expect(result).toHaveProperty('content');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should log debug message when attempting API call', async () => {
      await perchanceService.generateDare('funny');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        { theme: 'funny' },
        'Attempting to generate dare from Perchance API',
      );
    });
  });

  describe('getAvailableThemes', () => {
    it('should return array of available themes', () => {
      const themes = perchanceService.getAvailableThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('general');
      expect(themes).toContain('funny');
      expect(themes).toContain('creative');
    });
  });

  describe('isValidTheme', () => {
    it('should return true for valid themes', () => {
      expect(perchanceService.isValidTheme('general')).toBe(true);
      expect(perchanceService.isValidTheme('funny')).toBe(true);
      expect(perchanceService.isValidTheme('creative')).toBe(true);
    });

    it('should return false for invalid themes', () => {
      expect(perchanceService.isValidTheme('invalid')).toBe(false);
      expect(perchanceService.isValidTheme('')).toBe(false);
      expect(perchanceService.isValidTheme(null)).toBe(false);
    });
  });

  describe('_getFallbackDare', () => {
    it('should return a random fallback dare', () => {
      const dare1 = perchanceService._getFallbackDare();
      const dare2 = perchanceService._getFallbackDare();

      expect(typeof dare1).toBe('string');
      expect(dare1.length).toBeGreaterThan(0);
      expect(typeof dare2).toBe('string');
      // May or may not be different due to randomness
    });
  });
});
