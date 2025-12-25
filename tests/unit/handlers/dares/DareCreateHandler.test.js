const DareCreateHandler = require('../../../../src/app/handlers/dares/DareCreateHandler');

describe('DareCreateHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      generateDareFromPerchance: jest.fn(),
    };
    handler = new DareCreateHandler(mockDareService);
  });

  it('should create a dare with default theme', async () => {
    mockDareService.generateDareFromPerchance.mockResolvedValue({
      id: 1,
      content: 'Test dare',
      source: 'perchance',
      theme: 'general',
    });

    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare.id).toBe(1);
    expect(result.data.message).toBe('Dare #1 created successfully!');
    expect(mockDareService.generateDareFromPerchance).toHaveBeenCalledWith('general', 'user123');
  });

  it('should create a dare with specified theme', async () => {
    mockDareService.generateDareFromPerchance.mockResolvedValue({
      id: 2,
      content: 'Funny dare',
      source: 'perchance',
      theme: 'funny',
    });

    const command = {
      userId: 'user123',
      metadata: {
        theme: 'funny',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare.theme).toBe('funny');
    expect(mockDareService.generateDareFromPerchance).toHaveBeenCalledWith('funny', 'user123');
  });

  it('should return error on service failure', async () => {
    mockDareService.generateDareFromPerchance.mockRejectedValue(new Error('Service error'));

    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Service error');
  });
});
