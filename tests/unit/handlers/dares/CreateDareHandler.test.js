const CreateDareHandler = require('../../../../src/app/handlers/dares/CreateDareHandler');

describe('CreateDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      createDare: jest.fn(),
    };
    handler = new CreateDareHandler(mockDareService);
  });

  it('should create a dare successfully', async () => {
    mockDareService.createDare.mockResolvedValue({
      id: 1,
      content: 'Test dare',
      theme: 'general',
      source: 'perchance',
      created_by: 'user123',
      status: 'active',
    });

    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(1);
    expect(result.data.content).toBe('Test dare');
    expect(result.data.theme).toBe('general');
    expect(result.data.source).toBe('perchance');
    expect(mockDareService.createDare).toHaveBeenCalledWith('user123', 'general', null);
  });

  it('should create dare with custom theme', async () => {
    mockDareService.createDare.mockResolvedValue({
      id: 2,
      content: 'Humiliating dare',
      theme: 'humiliating',
      source: 'perchance',
      created_by: 'user123',
      status: 'active',
    });

    const command = {
      userId: 'user123',
      metadata: { theme: 'humiliating' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.theme).toBe('humiliating');
    expect(mockDareService.createDare).toHaveBeenCalledWith('user123', 'humiliating', null);
  });

  it('should create dare with custom generator', async () => {
    mockDareService.createDare.mockResolvedValue({
      id: 3,
      content: 'Custom dare',
      theme: 'general',
      source: 'perchance',
      created_by: 'user123',
      status: 'active',
    });

    const command = {
      userId: 'user123',
      metadata: { generator: 'custom-gen' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.createDare).toHaveBeenCalledWith('user123', 'general', 'custom-gen');
  });

  it('should indicate fallback dare', async () => {
    mockDareService.createDare.mockResolvedValue({
      id: 4,
      content: 'Fallback dare',
      theme: 'general',
      source: 'database_fallback',
      created_by: 'user456',
      status: 'active',
      fallback: true,
    });

    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.fallback).toBe(true);
    expect(result.data.message).toContain('fallback');
  });

  it('should return error when service fails', async () => {
    mockDareService.createDare.mockRejectedValue(new Error('API error'));

    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
