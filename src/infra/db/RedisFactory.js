const { Redis } = require('ioredis');

/**
 * Create a Redis connection instance with event listeners
 * Connects to Redis server and sets up logging for connection events
 * @param {Object} redisConfig - Redis configuration
 * @param {string} redisConfig.REDIS_HOST - Redis server hostname
 * @param {string|number} redisConfig.REDIS_PORT - Redis server port
 * @param {string|undefined} redisConfig.REDIS_PASSWORD - Redis password (optional)
 * @param {Object} logger - Logger instance for connection/error events
 * @returns {Redis} Configured ioredis Redis client instance
 * @example
 * const redis = createRedisConnection(redisConfig, logger);
 * const value = await redis.get('key');
 * await redis.set('key', 'value');
 */
function createRedisConnection(redisConfig, logger) {
  const client = new Redis({
    host: redisConfig.REDIS_HOST,
    port: Number(redisConfig.REDIS_PORT),
    password: redisConfig.REDIS_PASSWORD || undefined,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error({ err }, 'Redis error'));

  return client;
}

module.exports = { createRedisConnection };
