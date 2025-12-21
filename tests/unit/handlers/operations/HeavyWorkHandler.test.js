const HeavyWorkHandler = require('../../../../src/app/handlers/operations/HeavyWorkHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('HeavyWorkHandler', () => {
  let handler;
  let mockJobQueue;

  beforeEach(() => {
    mockJobQueue = {
      enqueue: jest.fn().mockResolvedValue({ id: 'job123' })
    };

    handler = new HeavyWorkHandler(mockJobQueue);
  });

  it('should enqueue heavy work job', async () => {
    const command = { 
      args: ['analyze'],
      userId: 'user123',
      source: 'discord'
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockJobQueue.enqueue).toHaveBeenCalledWith(
      'heavywork',
      expect.objectContaining({
        userId: 'user123',
        source: 'discord',
        args: ['analyze']
      }),
      expect.any(Object)
    );
    expect(result.data.jobId).toBe('job123');
  });

  it('should return message and job ID', async () => {
    const command = { 
      args: ['process'],
      userId: 'user456',
      source: 'api'
    };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('queued');
    expect(result.data.jobId).toBeDefined();
  });

  it('should set up job options with retries', async () => {
    const command = { 
      args: ['work'],
      userId: 'user789',
      source: 'cli'
    };

    await handler.handle(command);

    expect(mockJobQueue.enqueue).toHaveBeenCalledWith(
      'heavywork',
      expect.any(Object),
      expect.objectContaining({
        attempts: 5,
        backoff: expect.objectContaining({ type: 'exponential', delay: 2000 })
      })
    );
  });

  it('should propagate enqueue errors', async () => {
    mockJobQueue.enqueue.mockRejectedValue(new Error('Queue error'));

    const command = { 
      args: ['work'],
      userId: 'user123',
      source: 'discord'
    };

    await expect(handler.handle(command)).rejects.toThrow('Queue error');
  });

  it('should handle multiple args in payload', async () => {
    const command = { 
      args: ['analyze', 'param1', 'param2'],
      userId: 'user123',
      source: 'discord'
    };

    await handler.handle(command);

    expect(mockJobQueue.enqueue).toHaveBeenCalledWith(
      'heavywork',
      expect.objectContaining({
        args: ['analyze', 'param1', 'param2']
      }),
      expect.any(Object)
    );
  });

  it('should include remove on complete option', async () => {
    const command = { 
      args: ['work'],
      userId: 'user123',
      source: 'discord'
    };

    await handler.handle(command);

    expect(mockJobQueue.enqueue).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ removeOnComplete: true })
    );
  });

  it('should return proper result structure', async () => {
    const command = { 
      args: ['work'],
      userId: 'user123',
      source: 'discord'
    };

    const result = await handler.handle(command);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('jobId');
    expect(result.data).toHaveProperty('message');
  });
});
