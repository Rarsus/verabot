const CompleteDareHandler = require('../../../../src/app/handlers/dares/CompleteDareHandler');

describe('CompleteDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      completeDare: jest.fn(),
    };
    handler = new CompleteDareHandler(mockDareService);
  });

  it('should complete a dare successfully', async () => {
    mockDareService.completeDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(1);
    expect(result.data.completedBy).toBe('user123');
    expect(result.data.message).toBe('Dare #1 marked as completed!');
    expect(mockDareService.completeDare).toHaveBeenCalledWith(1, 'user123', undefined);
  });

  it('should complete a dare with notes', async () => {
    mockDareService.completeDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: { id: 1, notes: 'It was challenging!' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.completeDare).toHaveBeenCalledWith(1, 'user123', 'It was challenging!');
  });

  it('should return error when ID is missing', async () => {
    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare ID is required');
  });

  it('should return error when service fails', async () => {
    mockDareService.completeDare.mockRejectedValue(new Error('Not authorized'));

    const command = {
      userId: 'user123',
      metadata: { id: 1 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
