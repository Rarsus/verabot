const DareUpdateHandler = require('../../../../src/app/handlers/dares/DareUpdateHandler');

describe('DareUpdateHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      updateDare: jest.fn(),
    };
    handler = new DareUpdateHandler(mockDareService);
  });

  it('should update dare content successfully', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
        content: 'Updated dare content',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Dare #1 updated successfully!');
    expect(result.data.dareId).toBe(1);
    expect(mockDareService.updateDare).toHaveBeenCalledWith(1, {
      content: 'Updated dare content',
    });
  });

  it('should update dare status successfully', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
        status: 'archived',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.updateDare).toHaveBeenCalledWith(1, {
      status: 'archived',
    });
  });

  it('should update multiple fields', async () => {
    mockDareService.updateDare.mockResolvedValue(true);

    const command = {
      metadata: {
        dare_id: 1,
        content: 'New content',
        status: 'active',
        theme: 'funny',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.updateDare).toHaveBeenCalledWith(1, {
      content: 'New content',
      status: 'active',
      theme: 'funny',
    });
  });

  it('should return error when dare_id is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when no update fields provided', async () => {
    const command = {
      metadata: {
        dare_id: 1,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('No update fields provided');
  });

  it('should return error when update fails', async () => {
    mockDareService.updateDare.mockResolvedValue(false);

    const command = {
      metadata: {
        dare_id: 1,
        content: 'Updated content',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Failed to update dare #1');
  });

  it('should handle service error', async () => {
    mockDareService.updateDare.mockRejectedValue(new Error('Database error'));

    const command = {
      metadata: {
        dare_id: 1,
        content: 'Updated content',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Database error');
  });
});
