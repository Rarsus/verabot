const { z } = require('zod');

/**
 * Zod schema for Redis configuration validation
 * Validates connection parameters with sensible defaults
 * @type {z.ZodSchema}
 * @private
 */
const RedisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional()
});

/**
 * Load and validate Redis configuration from environment variables
 * Applies defaults and validates required fields
 * Exits process on validation failure
 * @param {Object} env - Environment variables object
 * @returns {Object} Validated Redis configuration
 * @returns {string} returns.REDIS_HOST - Redis server hostname (default: localhost)
 * @returns {string} returns.REDIS_PORT - Redis server port (default: 6379)
 * @returns {string|undefined} returns.REDIS_PASSWORD - Redis password (optional)
 * @example
 * const redisConfig = loadRedisConfig(process.env);
 * // Returns: { REDIS_HOST: 'localhost', REDIS_PORT: '6379', REDIS_PASSWORD: undefined }
 */
function loadRedisConfig(env) {
  const parsed = RedisSchema.safeParse(env);
  if (!parsed.success) {
    console.error('Invalid Redis configuration', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
}

module.exports = { loadRedisConfig };
