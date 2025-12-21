const { createConfig } = require('../config/Config');
const { createLogger } = require('../logging/Logger');
const { createMetrics } = require('../metrics/Metrics');
const { createDb } = require('../db/SqliteDb');
const { createRepositories } = require('../db/Repositories');

const CommandService = require('../../core/services/CommandService');
const PermissionService = require('../../core/services/PermissionService');
const RateLimitService = require('../../core/services/RateLimitService');
const HelpService = require('../../core/services/HelpService');

const { loadRedisConfig } = require('../config/RedisConfig');
const { createRedisConnection } = require('../db/RedisFactory');
const JobQueueService = require('../queue/JobQueueService');
const Scheduler = require('../queue/Scheduler');

function createContainer() {
  const config = createConfig();
  const logger = createLogger(config);
  const metrics = createMetrics();
  const db = createDb(config, logger);
  const repositories = createRepositories(db, logger);

  const commandService = new CommandService(repositories.commandRepo);
  const permissionService = new PermissionService(repositories.permissionRepo);
  const rateLimitService = new RateLimitService(
    repositories.rateLimitRepo,
    3000,
    {
      core: 0,
      messaging: 3000,
      operations: 10000,
      admin: 0
    }
  );
  const helpService = new HelpService(null); // registry attached in bootstrap

  const redisConfig = loadRedisConfig(process.env);
  const redis = createRedisConnection(redisConfig, logger);
  const jobQueue = new JobQueueService(redis, logger);
  const scheduler = new Scheduler(jobQueue, logger);

  const services = {
    commandService,
    permissionService,
    rateLimitService,
    helpService
  };

  return {
    config,
    logger,
    metrics,
    db,
    repositories,
    services,
    redis,
    jobQueue,
    scheduler
  };
}

module.exports = { createContainer };
