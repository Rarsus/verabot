const JobQueueService = require('../../../../src/infra/queue/JobQueueService');

// Mock bullmq
jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  Worker: jest.fn(),
  QueueScheduler: jest.fn(),
}));

const { Queue, Worker, QueueScheduler } = require('bullmq');

describe('JobQueueService', () => {
  let mockRedisConnection;
  let mockLogger;
  let mockQueue;
  let mockScheduler;
  let mockWorker;
  let service;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedisConnection = {
      host: 'localhost',
      port: 6379,
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job123' }),
    };

    mockWorker = {
      on: jest.fn(),
    };

    Queue.mockImplementation(() => mockQueue);
    QueueScheduler.mockImplementation(() => ({}));
    Worker.mockImplementation(() => mockWorker);

    service = new JobQueueService(mockRedisConnection, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Queue with correct options', () => {
      expect(Queue).toHaveBeenCalledWith('commands', {
        connection: mockRedisConnection,
      });
    });

    it('should initialize QueueScheduler', () => {
      expect(QueueScheduler).toHaveBeenCalledWith('commands', {
        connection: mockRedisConnection,
      });
    });

    it('should initialize Worker with handler function', () => {
      expect(Worker).toHaveBeenCalledWith('commands', expect.any(Function), {
        connection: mockRedisConnection,
      });
    });

    it('should store logger reference', () => {
      expect(service.logger).toBe(mockLogger);
    });

    it('should store queue reference', () => {
      expect(service.queue).toBe(mockQueue);
    });

    it('should store worker reference', () => {
      expect(service.worker).toBe(mockWorker);
    });

    it('should register worker event listeners', () => {
      expect(mockWorker.on).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockWorker.on).toHaveBeenCalledWith('failed', expect.any(Function));
    });
  });

  describe('enqueue', () => {
    it('should enqueue a job', async () => {
      const result = await service.enqueue('heavywork', { data: 'test' });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'heavywork',
        { handler: 'heavywork', payload: { data: 'test' } },
        {},
      );
      expect(result).toEqual({ id: 'job123' });
    });

    it('should enqueue with custom options', async () => {
      const options = { priority: 5, delay: 1000, attempts: 3 };
      await service.enqueue('cron:task', { task: 'data' }, options);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'cron:task',
        { handler: 'cron:task', payload: { task: 'data' } },
        options,
      );
    });

    it('should handle priority option', async () => {
      await service.enqueue('heavywork', {}, { priority: 10 });
      expect(mockQueue.add).toHaveBeenCalledWith('heavywork', expect.any(Object), { priority: 10 });
    });

    it('should handle delay option', async () => {
      await service.enqueue('cron:scheduled', {}, { delay: 5000 });
      expect(mockQueue.add).toHaveBeenCalledWith('cron:scheduled', expect.any(Object), {
        delay: 5000,
      });
    });

    it('should handle retry attempts option', async () => {
      await service.enqueue('task', {}, { attempts: 5 });
      expect(mockQueue.add).toHaveBeenCalledWith('task', expect.any(Object), { attempts: 5 });
    });

    it('should work with empty payload', async () => {
      await service.enqueue('test', {});

      expect(mockQueue.add).toHaveBeenCalledWith('test', { handler: 'test', payload: {} }, {});
    });
  });

  describe('Worker Handler Function', () => {
    let workerHandler;

    beforeEach(() => {
      const workerCall = Worker.mock.calls[0];
      workerHandler = workerCall[1];
    });

    describe('heavywork handler', () => {
      it('should process heavywork jobs', async () => {
        const job = {
          id: 'job1',
          data: { handler: 'heavywork', payload: { value: 123 } },
        };

        const result = await workerHandler(job);

        expect(result).toEqual({ ok: true });
        expect(mockLogger.info).toHaveBeenCalledWith(
          { jobId: 'job1', name: undefined },
          'Processing job',
        );
      });

      it('should wait 2 seconds for heavywork', async () => {
        const job = { id: 'job1', data: { handler: 'heavywork', payload: {} } };
        const start = Date.now();

        await workerHandler(job);

        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(1900);
      });

      it('should log heavywork execution', async () => {
        const payload = { important: 'data' };
        const job = { id: 'job1', data: { handler: 'heavywork', payload } };

        await workerHandler(job);

        expect(mockLogger.info).toHaveBeenCalledWith({ payload }, 'Heavywork job logic executed');
      });
    });

    describe('cron handler', () => {
      it('should process cron jobs', async () => {
        const job = {
          id: 'job2',
          data: { handler: 'cron:hourly', payload: { task: 'cleanup' } },
        };

        const result = await workerHandler(job);

        expect(result).toEqual({ ok: true });
      });

      it('should log cron job execution', async () => {
        const job = {
          id: 'job2',
          data: { handler: 'cron:daily', payload: { task: 'backup' } },
        };

        await workerHandler(job);

        expect(mockLogger.info).toHaveBeenCalledWith(
          { handler: 'cron:daily', payload: { task: 'backup' } },
          'Cron job executed',
        );
      });

      it('should handle various cron schedules', async () => {
        const schedules = ['cron:hourly', 'cron:daily', 'cron:weekly', 'cron:monthly'];

        for (const schedule of schedules) {
          const job = { id: 'job', data: { handler: schedule, payload: {} } };
          const result = await workerHandler(job);
          expect(result.ok).toBe(true);
        }
      });
    });

    describe('unknown handler', () => {
      it('should warn for unknown handler', async () => {
        const job = {
          id: 'job3',
          data: { handler: 'unknown', payload: {} },
        };

        const result = await workerHandler(job);

        expect(mockLogger.warn).toHaveBeenCalledWith(
          { handler: 'unknown' },
          'Unknown handler in job queue',
        );
        expect(result).toEqual({ ok: true });
      });

      it('should handle null handler', async () => {
        const job = { id: 'job4', data: { handler: null, payload: {} } };

        await workerHandler(job);

        expect(mockLogger.warn).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle job processing errors', async () => {
        const errorHandler = await workerHandler;
        expect(typeof errorHandler).toBe('function');
      });

      it('should log job id and name', async () => {
        const job = { id: 'job123', name: 'task', data: { handler: 'heavywork', payload: {} } };

        await workerHandler(job);

        expect(mockLogger.info).toHaveBeenCalledWith(
          { jobId: 'job123', name: 'task' },
          'Processing job',
        );
      });
    });
  });

  describe('Worker Event Listeners', () => {
    let completedHandler;
    let failedHandler;

    beforeEach(() => {
      const calls = mockWorker.on.mock.calls;
      completedHandler = calls.find((c) => c[0] === 'completed')?.[1];
      failedHandler = calls.find((c) => c[0] === 'failed')?.[1];
    });

    describe('completed event', () => {
      it('should log on job completion', () => {
        const job = { id: 'job123' };

        completedHandler(job);

        expect(mockLogger.info).toHaveBeenCalledWith({ jobId: 'job123' }, 'Job completed');
      });

      it('should handle multiple completions', () => {
        completedHandler({ id: 'job1' });
        completedHandler({ id: 'job2' });

        expect(mockLogger.info).toHaveBeenCalledTimes(2);
      });
    });

    describe('failed event', () => {
      it('should log on job failure', () => {
        const job = { id: 'job123' };
        const error = new Error('Test error');

        failedHandler(job, error);

        expect(mockLogger.error).toHaveBeenCalledWith(
          { jobId: 'job123', err: error },
          'Job failed',
        );
      });

      it('should handle null job', () => {
        const error = new Error('Fatal error');

        failedHandler(null, error);

        expect(mockLogger.error).toHaveBeenCalledWith(
          { jobId: undefined, err: error },
          'Job failed',
        );
      });

      it('should handle various error types', () => {
        const job = { id: 'job1' };
        const errors = [
          new Error('Connection error'),
          new Error('Timeout'),
          new Error('Invalid data'),
        ];

        errors.forEach((err) => {
          failedHandler(job, err);
        });

        expect(mockLogger.error).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should enqueue a job successfully', async () => {
      const job = await service.enqueue('heavywork', { data: 'test' });

      expect(job).toHaveProperty('id');
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should handle multiple concurrent enqueues', async () => {
      const promises = [
        service.enqueue('task1', { id: 1 }),
        service.enqueue('task2', { id: 2 }),
        service.enqueue('task3', { id: 3 }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should preserve job metadata', async () => {
      const payload = { userId: '123', action: 'cleanup', importance: 'high' };
      await service.enqueue('admin:cleanup', payload);

      const call = mockQueue.add.mock.calls[0];
      expect(call[1].payload).toEqual(payload);
    });
  });
});
