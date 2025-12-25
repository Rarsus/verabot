/**
 * Perchance API Service
 * Handles API communication with Perchance.org/api1 for generating dares
 * Includes caching, rate limiting, timeout handling, and fallback mechanisms
 * @class PerchanceService
 * @example
 * const perchanceService = new PerchanceService(config, logger);
 * const dare = await perchanceService.generateDare('dare-generator', 'humiliating');
 */

// Constants
const PERCHANCE_API_BASE = 'https://perchance.org/api1';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

class PerchanceService {
  /**
   * Create a new PerchanceService instance
   * @param {Object} config - Application configuration
   * @param {Object} logger - Logger instance
   */
  constructor(config, logger) {
    /** @type {Object} */
    this.config = config;
    /** @type {Object} */
    this.logger = logger;
    /** @type {Map<string, {data: string, timestamp: number}>} */
    this.cache = new Map();
  }

  /**
   * Generate a dare from Perchance API
   * @param {string} generatorName - Name of the Perchance generator
   * @param {string} [theme] - Optional theme/category for the dare
   * @returns {Promise<string>} Generated dare content
   * @throws {Error} If API call fails after retries
   */
  async generateDare(generatorName, theme = null) {
    const cacheKey = this._getCacheKey(generatorName, theme);

    // Check cache if enabled
    if (this.config.DARE_CACHE_ENABLED) {
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        this.logger.debug({ generatorName, theme }, 'Returning cached dare');
        return cached;
      }
    }

    // Try to fetch from API with retries
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const dare = await this._fetchFromApi(generatorName, theme);

        // Store in cache if enabled
        if (this.config.DARE_CACHE_ENABLED) {
          this._addToCache(cacheKey, dare);
        }

        return dare;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          { attempt, maxRetries: MAX_RETRIES, err: err.message },
          'Perchance API call failed, retrying',
        );

        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s
          await this._sleep(1000 * attempt);
        }
      }
    }

    // All retries failed
    this.logger.error({ err: lastError }, 'All Perchance API retries failed');
    throw new Error(
      `Failed to generate dare from Perchance API after ${MAX_RETRIES} attempts. Please try again later.`,
    );
  }

  /**
   * Fetch dare from Perchance API (single attempt)
   * @param {string} generatorName - Name of the Perchance generator
   * @param {string} [theme] - Optional theme/category
   * @returns {Promise<string>} Generated dare content
   * @private
   */
  async _fetchFromApi(generatorName, theme) {
    // Build URL with optional theme parameter
    let url = `${PERCHANCE_API_BASE}/${generatorName}`;
    if (theme) {
      url += `?theme=${encodeURIComponent(theme)}`;
    }

    this.logger.debug({ url }, 'Calling Perchance API');

    // Create abort controller for timeout
    // eslint-disable-next-line no-undef
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VeraBot/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Perchance API returned status ${response.status}`);
      }

      // Parse response - Perchance API can return different formats
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        // Try common response formats
        const dareContent = data.result || data.output || data.text || data.dare || data.content;

        if (!dareContent) {
          this.logger.error({ data }, 'Perchance API returned unexpected JSON format');
          throw new Error('Failed to extract dare from Perchance API response');
        }

        return dareContent.trim();
      } else {
        // Plain text response
        data = await response.text();
        if (!data || data.trim().length === 0) {
          throw new Error('Perchance API returned empty response');
        }
        return data.trim();
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Perchance API request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get cache key for generator and theme combination
   * @param {string} generatorName - Generator name
   * @param {string} [theme] - Theme name
   * @returns {string} Cache key
   * @private
   */
  _getCacheKey(generatorName, theme) {
    return theme ? `${generatorName}:${theme}` : generatorName;
  }

  /**
   * Get dare from cache if not expired
   * @param {string} cacheKey - Cache key
   * @returns {string|null} Cached dare or null if not found/expired
   * @private
   */
  _getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = (now - cached.timestamp) / 1000; // age in seconds

    if (age > this.config.DARE_CACHE_TTL) {
      // Expired
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Add dare to cache
   * @param {string} cacheKey - Cache key
   * @param {string} data - Dare content
   * @private
   */
  _addToCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached dares
   * @returns {void}
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Perchance dare cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      enabled: this.config.DARE_CACHE_ENABLED,
      ttl: this.config.DARE_CACHE_TTL,
    };
  }
}

module.exports = PerchanceService;
