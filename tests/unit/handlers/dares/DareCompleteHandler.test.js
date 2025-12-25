const DareCompleteHandler = require('../../../../src/app/handlers/dares/DareCompleteHandler');

describe('DareCompleteHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      completeDare: jest.fn(),
    };
    handler = new DareCompleteHandler(mockDareService);
  });

  it('should complete a dare successfully', async () => {
    mockDareService.completeDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Dare #1 marked as completed!');
    expect(result.data.dareId).toBe(1);
    expect(result.data.notes).toBe(null);
    expect(mockDareService.completeDare).toHaveBeenCalledWith(1, undefined);
  });

  it('should complete a dare with notes', async () => {
    mockDareService.completeDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
        notes: 'Completed on live stream!',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.notes).toBe('Completed on live stream!');
    expect(mockDareService.completeDare).toHaveBeenCalledWith(1, 'Completed on live stream!');
  });

  it('should return error when dare_id is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when completion fails', async () => {
    mockDareService.completeDare.mockResolvedValue(false);

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Failed to complete dare #1');
  });

  it('should handle service error', async () => {
    mockDareService.completeDare.mockRejectedValue(new Error('Database error'));

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
