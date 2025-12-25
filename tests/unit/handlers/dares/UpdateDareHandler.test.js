const UpdateDareHandler = require('../../../../src/app/handlers/dares/UpdateDareHandler');

describe('UpdateDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      updateDare: jest.fn(),
    };
    handler = new UpdateDareHandler(mockDareService);
  });

  it('should update dare content successfully', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: { id: 1, content: 'Updated content' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(1);
    expect(result.data.updates).toEqual({ content: 'Updated content' });
    expect(mockDareService.updateDare).toHaveBeenCalledWith(1, { content: 'Updated content' });
  });

  it('should update dare status successfully', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: { id: 1, status: 'archived' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.updates).toEqual({ status: 'archived' });
    expect(mockDareService.updateDare).toHaveBeenCalledWith(1, { status: 'archived' });
  });

  it('should update both content and status', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: { id: 1, content: 'New content', status: 'completed' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.updates).toEqual({ content: 'New content', status: 'completed' });
  });

  it('should return error when ID is missing', async () => {
    const command = {
      metadata: { content: 'Test' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when no updates provided', async () => {
    const command = {
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('At least one field to update is required');
  });

  it('should return error when service fails', async () => {
    mockDareService.updateDare.mockRejectedValue(new Error('Update failed'));

    const command = {
      metadata: { id: 1, content: 'Test' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
