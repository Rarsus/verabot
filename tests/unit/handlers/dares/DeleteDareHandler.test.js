const DeleteDareHandler = require('../../../../src/app/handlers/dares/DeleteDareHandler');

describe('DeleteDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      deleteDare: jest.fn(),
    };
    handler = new DeleteDareHandler(mockDareService);
  });

  it('should delete a dare successfully', async () => {
    mockDareService.deleteDare.mockResolvedValue(true);

    const command = {
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(1);
    expect(result.data.message).toBe('Dare #1 deleted successfully');
    expect(mockDareService.deleteDare).toHaveBeenCalledWith(1);
  });

  it('should return error when ID is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when service fails', async () => {
    mockDareService.deleteDare.mockRejectedValue(new Error('Delete failed'));

    const command = {
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
