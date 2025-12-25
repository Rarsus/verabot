const { createConfig } = require('../config/Config');
const { createLogger } = require('../logging/Logger');
const { createMetrics } = require('../metrics/Metrics');
const { createDb } = require('../db/SqliteDb');
const { createRepositories } = require('../db/Repositories');

const CommandService = require('../../core/services/CommandService');
const PermissionService = require('../../core/services/PermissionService');
const RateLimitService = require('../../core/services/RateLimitService');
const HelpService = require('../../core/services/HelpService');
const DareService = require('../../core/services/DareService');

const PerchanceService = require('../external/PerchanceService');

const { loadRedisConfig } = require('../config/RedisConfig');
const { createRedisConnection } = require('../db/RedisFactory');
const JobQueueService = require('../queue/JobQueueService');
const Scheduler = require('../queue/Scheduler');

/**
 * Create and initialize application dependency injection container
 * Initializes all application services, infrastructure, and data access layers
 * Returns single container instance with all dependencies properly wired
 * @returns {Object} Dependency container with all initialized services
 * @returns {Object} returns.config - Application configuration (DISCORD_TOKEN, DISCORD_CLIENT_ID, etc.)
 * @returns {Object} returns.logger - Logger instance for application logging
 * @returns {Object} returns.metrics - Prometheus metrics collector
 * @returns {Object} returns.db - SQLite database connection
 * @returns {Object} returns.repositories - Data access layer repositories (command, permission, rateLimit, dare)
 * @returns {Object} returns.services - Core application services (CommandService, PermissionService, RateLimitService, HelpService, DareService)
 * @returns {Object} returns.redis - Redis connection for caching and pub/sub
 * @returns {JobQueueService} returns.jobQueue - Background job queue service
 * @returns {Scheduler} returns.scheduler - Cron job scheduler
 * @returns {PerchanceService} returns.perchanceService - Perchance AI text generation service
 * @example
 * const container = createContainer();
 * const { config, logger, services, db, repositories } = container;
 */
function createContainer() {
  const config = createConfig();
  const logger = createLogger(config);
  const metrics = createMetrics();
  const db = createDb(config, logger);
  const repositories = createRepositories(db, logger);

  const commandService = new CommandService(repositories.commandRepo);
  const permissionService = new PermissionService(repositories.permissionRepo);
  const rateLimitService = new RateLimitService(repositories.rateLimitRepo, 3000, {
    core: 0,
    messaging: 3000,
    operations: 10000,
    admin: 0,
    dares: 5000,
  });
  const helpService = new HelpService(null); // registry attached in bootstrap

  const perchanceService = new PerchanceService(logger);
  const dareService = new DareService(repositories.dareRepo, perchanceService);

  const redisConfig = loadRedisConfig(process.env);
  const redis = createRedisConnection(redisConfig, logger);
  const jobQueue = new JobQueueService(redis, logger);
  const scheduler = new Scheduler(jobQueue, logger);

  const services = {
    commandService,
    permissionService,
    rateLimitService,
    helpService,
    dareService,
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
    scheduler,
    perchanceService,
  };
}

module.exports = { createContainer };
