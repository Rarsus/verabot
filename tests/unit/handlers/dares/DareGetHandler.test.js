const DareGetHandler = require('../../../../src/app/handlers/dares/DareGetHandler');

describe('DareGetHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getDareById: jest.fn(),
    };
    handler = new DareGetHandler(mockDareService);
  });

  it('should get a dare by id successfully', async () => {
    const mockDare = {
      id: 1,
      content: 'Test dare',
      status: 'active',
      theme: 'general',
    };
    mockDareService.getDareById.mockResolvedValue(mockDare);

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare).toEqual(mockDare);
    expect(result.data.message).toBe('Dare #1');
    expect(mockDareService.getDareById).toHaveBeenCalledWith(1);
  });

  it('should return error when dare_id is missing', async () => {
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
      metadata: {
        dare_id: 999,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare #999 not found');
  });

  it('should handle service error', async () => {
    mockDareService.getDareById.mockRejectedValue(new Error('Database error'));

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Database error');
  });
});
