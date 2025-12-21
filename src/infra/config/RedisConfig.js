const { z } = require('zod');

const RedisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional()
});

function loadRedisConfig(env) {
  const parsed = RedisSchema.safeParse(env);
  if (!parsed.success) {
    console.error('Invalid Redis configuration', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
}

module.exports = { loadRedisConfig };
