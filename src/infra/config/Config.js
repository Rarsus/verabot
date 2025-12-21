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
 * @example
 * const config = createConfig();
 * console.log(config.DISCORD_TOKEN); // '...'
 * console.log(config.NODE_ENV); // 'production'
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
