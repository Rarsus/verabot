const { Redis } = require('ioredis');

function createRedisConnection(redisConfig, logger) {
  const client = new Redis({
    host: redisConfig.REDIS_HOST,
    port: Number(redisConfig.REDIS_PORT),
    password: redisConfig.REDIS_PASSWORD || undefined
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error({ err }, 'Redis error'));

  return client;
}

module.exports = { createRedisConnection };
