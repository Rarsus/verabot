const DeployHandler = require('../../../../src/app/handlers/operations/DeployHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('DeployHandler', () => {
  let handler;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
    };
    handler = new DeployHandler(mockLogger);
  });

  it('should deploy to production by default', async () => {
    const command = { args: [] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toContain('production');
    expect(mockLogger.info).toHaveBeenCalledWith({ target: 'production' }, expect.any(String));
  });

  it('should deploy to specified target', async () => {
    const command = { args: ['staging'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toContain('staging');
    expect(mockLogger.info).toHaveBeenCalledWith({ target: 'staging' }, expect.any(String));
  });

  it('should return success message with target', async () => {
    const command = { args: ['dev'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('dev');
    expect(result.data.message).toContain('completed successfully');
  });

  it('should log deployment with correct format', async () => {
    const command = { args: ['prod'] };

    await handler.handle(command);

    const logCall = mockLogger.info.mock.calls[0];
    expect(logCall[0].target).toBe('prod');
    expect(logCall[1]).toContain('deployment');
  });

  it('should wait during deployment simulation', async () => {
    const command = { args: ['test'] };
    const start = Date.now();

    await handler.handle(command);

    const elapsed = Date.now() - start;
    // Should be at least 1500ms
    expect(elapsed).toBeGreaterThanOrEqual(1400); // Allow 100ms margin
  });

  it('should handle multiple arguments (use first)', async () => {
    const command = { args: ['prod', 'extra', 'args'] };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('prod');
    expect(mockLogger.info).toHaveBeenCalledWith({ target: 'prod' }, expect.any(String));
  });

  it('should have successful command result', async () => {
    const command = { args: ['staging'] };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.message).toBeDefined();
  });
});
