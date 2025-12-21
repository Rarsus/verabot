const Scheduler = require('../../../../src/infra/queue/Scheduler');

describe('Scheduler', () => {
  let scheduler;
  let mockJobQueue;
  let mockLogger;
  let mockQueue;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockJobQueue = {
      queue: mockQueue,
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    scheduler = new Scheduler(mockJobQueue, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with jobQueue and logger', () => {
      expect(scheduler.jobQueue).toBe(mockJobQueue);
      expect(scheduler.logger).toBe(mockLogger);
    });
  });

  describe('registerCronJobs', () => {
    it('should log registration message', async () => {
      await scheduler.registerCronJobs();
      expect(mockLogger.info).toHaveBeenCalledWith('Registering cron jobs');
    });

    it('should add heartbeat cron job to queue', async () => {
      await scheduler.registerCronJobs();
      expect(mockQueue.add).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'cron:heartbeat',
        expect.objectContaining({ timestamp: expect.any(Number) }),
        expect.objectContaining({ repeat: { cron: '* * * * *' } })
      );
    });

    it('should set removeOnComplete for heartbeat job', async () => {
      await scheduler.registerCronJobs();
      const callArgs = mockQueue.add.mock.calls[0];
      expect(callArgs[2]).toEqual(
        expect.objectContaining({
          repeat: { cron: '* * * * *' },
          removeOnComplete: true,
        })
      );
    });

    it('should use current timestamp for job data', async () => {
      const beforeTime = Date.now();
      await scheduler.registerCronJobs();
      const afterTime = Date.now();

      const callArgs = mockQueue.add.mock.calls[0];
      const jobData = callArgs[1];
      expect(jobData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(jobData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle queue.add resolution', async () => {
      const result = await scheduler.registerCronJobs();
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should throw if queue.add fails', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));
      await expect(scheduler.registerCronJobs()).rejects.toThrow('Queue error');
    });

    it('should be callable multiple times', async () => {
      await scheduler.registerCronJobs();
      await scheduler.registerCronJobs();
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });
  });
});
