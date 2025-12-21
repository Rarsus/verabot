jest.mock('../../../../src/infra/config/Config', () => ({
  createConfig: () => ({
    DISCORD_TOKEN: 'test-token',
    DISCORD_CLIENT_ID: 'test-client-id',
    NODE_ENV: 'test',
  }),
}));

jest.mock('../../../../src/infra/logging/Logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

jest.mock('../../../../src/infra/metrics/Metrics', () => ({
  createMetrics: () => ({
    recordCommand: jest.fn(),
    recordError: jest.fn(),
  }),
}));

jest.mock('../../../../src/infra/db/SqliteDb', () => ({
  createDb: () => ({
    raw: { prepare: jest.fn().mockReturnThis(), run: jest.fn(), all: jest.fn() },
  }),
}));

jest.mock('../../../../src/infra/db/Repositories', () => ({
  createRepositories: () => ({
    commandRepo: {},
    permissionRepo: {},
    auditRepo: {},
    rateLimitRepo: {},
  }),
}));

jest.mock('../../../../src/infra/config/RedisConfig', () => ({
  loadRedisConfig: () => ({ host: 'localhost', port: 6379 }),
}));

jest.mock('../../../../src/infra/db/RedisFactory', () => ({
  createRedisConnection: () => ({ connect: jest.fn(), disconnect: jest.fn() }),
}));

jest.mock('../../../../src/infra/queue/JobQueueService', () => {
  return jest.fn().mockImplementation(() => ({ enqueue: jest.fn() }));
});

jest.mock('../../../../src/infra/queue/Scheduler', () => {
  return jest.fn().mockImplementation(() => ({ start: jest.fn() }));
});

const { createContainer } = require('../../../../src/infra/di/container');

describe('DI Container', () => {
  jest.setTimeout(10000); // Increase timeout for container creation

  describe('Container Creation', () => {
    it('should create a container', () => {
      const container = createContainer();
      expect(container).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof createContainer).toBe('function');
    });

    it('should return an object', () => {
      const container = createContainer();
      expect(typeof container).toBe('object');
    });
  });

  describe('Container Properties', () => {
    it('should have services property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('services');
    });

    it('should have logger property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('logger');
    });

    it('should have db property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('db');
    });

    it('should have repositories property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('repositories');
    });

    it('should have redis property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('redis');
    });

    it('should have jobQueue property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('jobQueue');
    });

    it('should have config property', () => {
      const container = createContainer();
      expect(container).toHaveProperty('config');
    });
  });

  describe('Services', () => {
    it('should have services object with properties', () => {
      const container = createContainer();
      expect(container.services).toBeDefined();
      expect(typeof container.services).toBe('object');
    });

    it('should have commandService', () => {
      const container = createContainer();
      expect(container.services).toHaveProperty('commandService');
    });

    it('should have permissionService', () => {
      const container = createContainer();
      expect(container.services).toHaveProperty('permissionService');
    });

    it('should have rateLimitService', () => {
      const container = createContainer();
      expect(container.services).toHaveProperty('rateLimitService');
    });

    it('should have helpService', () => {
      const container = createContainer();
      expect(container.services).toHaveProperty('helpService');
    });
  });

  describe('Infrastructure Components', () => {
    it('should load configuration', () => {
      const container = createContainer();
      expect(container.config).toBeDefined();
      expect(typeof container.config).toBe('object');
    });

    it('should have DISCORD_TOKEN in config', () => {
      const container = createContainer();
      expect(container.config).toHaveProperty('DISCORD_TOKEN');
    });

    it('should have DISCORD_CLIENT_ID in config', () => {
      const container = createContainer();
      expect(container.config).toHaveProperty('DISCORD_CLIENT_ID');
    });

    it('should create database instance', () => {
      const container = createContainer();
      expect(container.db).toBeDefined();
    });

    it('should create repositories object', () => {
      const container = createContainer();
      expect(container.repositories).toBeDefined();
      expect(typeof container.repositories).toBe('object');
    });

    it('should create Redis connection', () => {
      const container = createContainer();
      expect(container.redis).toBeDefined();
    });

    it('should create job queue', () => {
      const container = createContainer();
      expect(container.jobQueue).toBeDefined();
    });

    it('should create logger', () => {
      const container = createContainer();
      expect(container.logger).toBeDefined();
      expect(typeof container.logger.info).toBe('function');
    });
  });

  describe('Multiple Instances', () => {
    it('should create independent containers', () => {
      const container1 = createContainer();
      const container2 = createContainer();
      expect(container1).not.toBe(container2);
    });

    it('should have separate services', () => {
      const container1 = createContainer();
      const container2 = createContainer();
      expect(container1.services).not.toBe(container2.services);
    });
  });
});
