const { createRedisConnection } = require('../../../../src/infra/db/RedisFactory');
const { Redis } = require('ioredis');

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn(),
  };
});

describe('RedisFactory', () => {
  let mockClient;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      on: jest.fn(),
    };

    Redis.mockImplementation(() => mockClient);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
  });

  describe('createRedisConnection', () => {
    it('should create Redis client with default config', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: undefined,
      };

      const client = createRedisConnection(config, mockLogger);

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: undefined,
      });
      expect(client).toBe(mockClient);
    });

    it('should create Redis client with custom host and port', () => {
      const config = {
        REDIS_HOST: 'redis.example.com',
        REDIS_PORT: '6380',
        REDIS_PASSWORD: undefined,
      };

      createRedisConnection(config, mockLogger);

      expect(Redis).toHaveBeenCalledWith({
        host: 'redis.example.com',
        port: 6380,
        password: undefined,
      });
    });

    it('should create Redis client with password', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: 'secret123',
      };

      createRedisConnection(config, mockLogger);

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: 'secret123',
      });
    });

    it('should convert port to number', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6381',
        REDIS_PASSWORD: undefined,
      };

      createRedisConnection(config, mockLogger);

      const callArgs = Redis.mock.calls[0][0];
      expect(typeof callArgs.port).toBe('number');
      expect(callArgs.port).toBe(6381);
    });

    it('should register connect event listener', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };

      createRedisConnection(config, mockLogger);

      expect(mockClient.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
    });

    it('should register error event listener', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };

      createRedisConnection(config, mockLogger);

      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should log on connect event', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };

      createRedisConnection(config, mockLogger);

      const connectHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'connect',
      )[1];
      connectHandler();

      expect(mockLogger.info).toHaveBeenCalledWith('Redis connected');
    });

    it('should log errors', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };

      createRedisConnection(config, mockLogger);

      const errorHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'error',
      )[1];

      const error = new Error('Connection failed');
      errorHandler(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: error },
        'Redis error',
      );
    });

    it('should return Redis client instance', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };

      const client = createRedisConnection(config, mockLogger);

      expect(client).toBe(mockClient);
    });

    it('should handle undefined password', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: undefined,
      };

      createRedisConnection(config, mockLogger);

      const callArgs = Redis.mock.calls[0][0];
      expect(callArgs.password).toBeUndefined();
    });

    it('should handle empty password string', () => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
      };

      createRedisConnection(config, mockLogger);

      const callArgs = Redis.mock.calls[0][0];
      expect(callArgs.password).toBeUndefined();
    });
  });
});
