const JobStatusHandler = require('../../../../src/app/handlers/operations/JobStatusHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('JobStatusHandler', () => {
  let handler;
  let mockJobQueue;
  let mockJob;

  beforeEach(() => {
    mockJob = {
      getState: jest.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: { result: 'success' }
    };
    mockJobQueue = {
      queue: {
        getJob: jest.fn().mockResolvedValue(mockJob)
      }
    };
    handler = new JobStatusHandler(mockJobQueue);
  });

  it('should return job status', async () => {
    const command = { args: ['job123'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.jobId).toBe('job123');
    expect(result.data.state).toBe('completed');
  });

  it('should include job progress', async () => {
    const command = { args: ['job456'] };

    const result = await handler.handle(command);

    expect(result.data.progress).toBe(100);
  });

  it('should include job return value', async () => {
    const command = { args: ['job789'] };

    const result = await handler.handle(command);

    expect(result.data.returnValue).toEqual({ result: 'success' });
  });

  it('should fail when job ID is missing', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Missing job ID');
  });

  it('should fail when job is not found', async () => {
    mockJobQueue.queue.getJob.mockResolvedValue(null);
    const command = { args: ['invalid'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('not found');
  });

  it('should handle active job state', async () => {
    mockJob.getState.mockResolvedValue('active');
    mockJob.progress = 50;

    const command = { args: ['job123'] };
    const result = await handler.handle(command);

    expect(result.data.state).toBe('active');
    expect(result.data.progress).toBe(50);
  });

  it('should handle pending job state', async () => {
    mockJob.getState.mockResolvedValue('waiting');
    mockJob.progress = 0;

    const command = { args: ['job123'] };
    const result = await handler.handle(command);

    expect(result.data.state).toBe('waiting');
    expect(result.data.progress).toBe(0);
  });

  it('should propagate getState errors', async () => {
    mockJob.getState.mockRejectedValue(new Error('Job error'));

    const command = { args: ['job123'] };

    await expect(handler.handle(command)).rejects.toThrow('Job error');
  });

  it('should propagate getJob errors', async () => {
    mockJobQueue.queue.getJob.mockRejectedValue(new Error('Queue error'));

    const command = { args: ['job123'] };

    await expect(handler.handle(command)).rejects.toThrow('Queue error');
  });
});
