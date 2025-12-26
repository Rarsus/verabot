const { z } = require('zod');

/**
 * Zod schema for validating application configuration
 * Validates critical Discord bot settings and optional infrastructure configuration
 * @type {z.ZodSchema}
 * @private
 */
const ConfigSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  WS_URL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  HTTP_PORT: z.string().default('3000'),
  // Perchance Dare Configuration
  PERCHANCE_DARE_GENERATOR: z.string().default('dare-generator'),
  DARE_THEMES: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .pipe(z.array(z.string()))
    .default('general,humiliating,sexy,chastity,anal,funny'),
  DARE_CACHE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('true'),
  DARE_CACHE_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('3600'),
});

/**
 * Create and validate application configuration
 * Parses and validates environment variables using ConfigSchema
 * Exits process if validation fails
 * @returns {Object} Validated configuration object with all required and optional fields
 * @returns {string} returns.DISCORD_TOKEN - Discord bot authentication token (required)
 * @returns {string} returns.DISCORD_CLIENT_ID - Discord application client ID (required)
 * @returns {string} returns.WS_URL - WebSocket server URL (required)
 * @returns {string} returns.NODE_ENV - Environment name (development/production/test, default: development)
 * @returns {string} returns.LOG_LEVEL - Logging level (debug/info/warn/error, default: info)
 * @returns {string} returns.HTTP_PORT - HTTP server port (default: 3000)
 * @returns {string} returns.PERCHANCE_DARE_GENERATOR - Perchance generator name for dares (default: dare-generator)
 * @returns {Array<string>} returns.DARE_THEMES - Array of dare themes (default: general,humiliating,sexy,chastity,anal,funny)
 * @returns {boolean} returns.DARE_CACHE_ENABLED - Enable dare caching (default: true)
 * @returns {number} returns.DARE_CACHE_TTL - Cache TTL in seconds (default: 3600)
 * @example
 * const config = createConfig();
 * console.log(config.DISCORD_TOKEN); // '...'
 * console.log(config.NODE_ENV); // 'production'
 * console.log(config.DARE_THEMES); // ['general', 'humiliating', ...]
 */
function createConfig() {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid configuration', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
}

module.exports = { createConfig };
