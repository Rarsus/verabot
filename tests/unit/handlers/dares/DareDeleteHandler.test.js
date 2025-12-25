const DareDeleteHandler = require('../../../../src/app/handlers/dares/DareDeleteHandler');

describe('DareDeleteHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      deleteDare: jest.fn(),
    };
    handler = new DareDeleteHandler(mockDareService);
  });

  it('should delete a dare successfully', async () => {
    mockDareService.deleteDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Dare #1 deleted successfully!');
    expect(result.data.dareId).toBe(1);
    expect(mockDareService.deleteDare).toHaveBeenCalledWith(1);
  });

  it('should return error when dare_id is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when deletion fails', async () => {
    mockDareService.deleteDare.mockResolvedValue(false);

    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Failed to delete dare #1');
  });

  it('should handle service error', async () => {
    mockDareService.deleteDare.mockRejectedValue(new Error('Database error'));

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
