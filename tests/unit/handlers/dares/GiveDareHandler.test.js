const GiveDareHandler = require('../../../../src/app/handlers/dares/GiveDareHandler');

describe('GiveDareHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getRandomDare: jest.fn(),
      getDareById: jest.fn(),
      assignDare: jest.fn(),
    };
    handler = new GiveDareHandler(mockDareService);
  });

  it('should give a random dare to user', async () => {
    const mockDare = { id: 1, content: 'Test dare', status: 'active' };
    mockDareService.getRandomDare.mockResolvedValue(mockDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      metadata: { user: 'targetUser', random: true },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(1);
    expect(result.data.assignedTo).toBe('targetUser');
    expect(mockDareService.getRandomDare).toHaveBeenCalledWith({ status: 'active' });
    expect(mockDareService.assignDare).toHaveBeenCalledWith(1, 'targetUser');
  });

  it('should give a specific dare to user', async () => {
    const mockDare = { id: 5, content: 'Specific dare', status: 'active' };
    mockDareService.getDareById.mockResolvedValue(mockDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      metadata: { user: 'targetUser', dare_id: 5, random: false },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dareId).toBe(5);
    expect(mockDareService.getDareById).toHaveBeenCalledWith(5);
    expect(mockDareService.assignDare).toHaveBeenCalledWith(5, 'targetUser');
  });

  it('should default to random when dare_id not provided', async () => {
    const mockDare = { id: 1, content: 'Test dare', status: 'active' };
    mockDareService.getRandomDare.mockResolvedValue(mockDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      metadata: { user: 'targetUser' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.getRandomDare).toHaveBeenCalled();
  });

  it('should return error when user is missing', async () => {
    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Target user is required');
  });

  it('should return error when no active dares available', async () => {
    mockDareService.getRandomDare.mockResolvedValue(null);

    const command = {
      metadata: { user: 'targetUser', random: true },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('No active dares available');
  });

  it('should return error when specific dare not found', async () => {
    mockDareService.getDareById.mockResolvedValue(null);

    const command = {
      metadata: { user: 'targetUser', dare_id: 999 },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Dare #999 not found');
  });

  it('should handle random as string "true"', async () => {
    const mockDare = { id: 1, content: 'Test dare', status: 'active' };
    mockDareService.getRandomDare.mockResolvedValue(mockDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      metadata: { user: 'targetUser', random: 'true' },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.getRandomDare).toHaveBeenCalled();
  });
});
