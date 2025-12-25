const GetDareHandler = require('../../../../src/app/handlers/dares/GetDareHandler');

describe('GetDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getDareById: jest.fn(),
    };
    handler = new GetDareHandler(mockDareService);
  });

  it('should get a dare by ID successfully', async () => {
    const mockDare = { id: 1, content: 'Test dare', status: 'active' };
    mockDareService.getDareById.mockResolvedValue(mockDare);

    const command = {
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare).toEqual(mockDare);
    expect(result.data.message).toBe('Dare #1 retrieved successfully');
    expect(mockDareService.getDareById).toHaveBeenCalledWith(1);
  });

  it('should return error when ID is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when dare not found', async () => {
    mockDareService.getDareById.mockResolvedValue(null);

    const command = {
      metadata: { id: 999 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare #999 not found');
  });

  it('should return error when service fails', async () => {
    mockDareService.getDareById.mockRejectedValue(new Error('Database error'));

    const command = {
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
