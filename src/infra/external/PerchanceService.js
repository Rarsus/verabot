/**
 * Perchance Service
 * Handles communication with Perchance.org API for AI text generation
 * @class PerchanceService
 * @example
 * const perchanceService = new PerchanceService(logger);
 * const dare = await perchanceService.generateDare('funny');
 */

const https = require('https');

// Default dare templates for fallback
const FALLBACK_DARES = [
  'Do 10 jumping jacks right now',
  'Send a positive message to someone you haven\'t talked to in a while',
  'Post your favorite meme in the chat',
  'Share an embarrassing but funny story',
  'Compliment the last three people who posted in chat',
  'Do your best impression of a famous person',
  'Share your most unpopular opinion',
  'Tell us a joke (it can be bad!)',
  'Share what you\'re grateful for today',
  'Dance for 30 seconds (video proof optional)',
];

// Dare themes for generation
const DARE_THEMES = {
  general: 'general',
  funny: 'funny',
  creative: 'creative',
  social: 'social',
  physical: 'physical',
  mental: 'mental',
};

class PerchanceService {
  /**
   * Create a new PerchanceService instance
   * @param {Object} logger - Logger instance
   * @param {number} [timeout=5000] - Request timeout in milliseconds
   */
  constructor(logger, timeout = 5000) {
    /** @type {Object} */
    this.logger = logger;
    /** @type {number} */
    this.timeout = timeout;
    /** @type {Object} */
    this.themes = DARE_THEMES;
  }

  /**
   * Generate a dare using Perchance API
   * Falls back to local templates if API is unavailable
   * @param {string} [theme='general'] - Dare theme/category
   * @returns {Promise<Object>} Generated dare with content and metadata
   */
  async generateDare(theme = 'general') {
    const validTheme = this.themes[theme] || 'general';
    
    try {
      this.logger.debug({ theme: validTheme }, 'Attempting to generate dare from Perchance API');
      
      // Try to fetch from Perchance generator
      const dareText = await this._fetchFromPerchance(validTheme);
      
      if (dareText) {
        this.logger.info({ theme: validTheme }, 'Successfully generated dare from Perchance');
        return {
          content: dareText,
          source: 'perchance',
          theme: validTheme,
        };
      }
    } catch (error) {
      this.logger.warn({ error: error.message, theme: validTheme }, 'Perchance API failed, using fallback');
    }

    // Fallback to local templates
    const fallbackDare = this._getFallbackDare();
    this.logger.info({ theme: validTheme }, 'Using fallback dare template');
    
    return {
      content: fallbackDare,
      source: 'fallback',
      theme: validTheme,
    };
  }

  /**
   * Fetch dare text from Perchance generator
   * @private
   * @param {string} theme - Dare theme
   * @returns {Promise<string|null>} Generated dare text or null
   */
  async _fetchFromPerchance(theme) {
    return new Promise((resolve) => {
      // Perchance.org simple dare generator endpoint
      // Using a generic text generator as the specific dare generator may not exist
      const hostname = 'perchance.org';
      const path = `/api/generate?generatorName=dare-generator&theme=${encodeURIComponent(theme)}`;
      
      const options = {
        hostname,
        path,
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'VeraBot/1.0',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              // Try to parse JSON response
              const parsed = JSON.parse(data);
              if (parsed.text || parsed.output || parsed.result) {
                resolve(parsed.text || parsed.output || parsed.result);
                return;
              }
            }
            // If response is plain text
            if (data && data.length > 0 && data.length < 500) {
              resolve(data.trim());
              return;
            }
          } catch (error) {
            this.logger.debug({ error: error.message }, 'Failed to parse Perchance response');
          }
          resolve(null);
        });
      });

      req.on('error', (error) => {
        this.logger.debug({ error: error.message }, 'Perchance API request error');
        resolve(null);
      });

      req.on('timeout', () => {
        this.logger.debug('Perchance API request timeout');
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  /**
   * Get a random fallback dare from templates
   * @private
   * @returns {string} Random dare text
   */
  _getFallbackDare() {
    const index = Math.floor(Math.random() * FALLBACK_DARES.length);
    return FALLBACK_DARES[index];
  }

  /**
   * Get list of available themes
   * @returns {Array<string>} Array of theme names
   */
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  /**
   * Validate if a theme is supported
   * @param {string} theme - Theme to validate
   * @returns {boolean} True if theme is valid
   */
  isValidTheme(theme) {
    return !!this.themes[theme];
  }
}

module.exports = PerchanceService;
