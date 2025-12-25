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
    expect(result.data.source).toBe('perchance');
    expect(mockDareService.createDare).toHaveBeenCalledWith('user123');
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
