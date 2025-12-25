const DareGiveHandler = require('../../../../src/app/handlers/dares/DareGiveHandler');

describe('DareGiveHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getRandomDare: jest.fn(),
      generateDareFromPerchance: jest.fn(),
      assignDare: jest.fn(),
    };
    handler = new DareGiveHandler(mockDareService);
  });

  it('should give a fresh dare to a user', async () => {
    mockDareService.generateDareFromPerchance.mockResolvedValue({
      id: 1,
      content: 'Test dare',
      theme: 'general',
      source: 'perchance',
    });
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: {
        user: 'user456',
        random: false,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Dare #1 assigned to <@user456>!');
    expect(result.data.dare.assigned_to).toBe('user456');
    expect(mockDareService.generateDareFromPerchance).toHaveBeenCalledWith('general', 'user123');
    expect(mockDareService.assignDare).toHaveBeenCalledWith(1, 'user456');
  });

  it('should give a random existing dare to a user', async () => {
    const existingDare = {
      id: 5,
      content: 'Existing dare',
      theme: 'funny',
      status: 'active',
    };
    mockDareService.getRandomDare.mockResolvedValue(existingDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: {
        user: 'user456',
        random: true,
        theme: 'funny',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare.id).toBe(5);
    expect(mockDareService.getRandomDare).toHaveBeenCalledWith({ theme: 'funny' });
    expect(mockDareService.assignDare).toHaveBeenCalledWith(5, 'user456');
  });

  it('should generate new dare when random requested but none exist', async () => {
    mockDareService.getRandomDare.mockResolvedValue(null);
    mockDareService.generateDareFromPerchance.mockResolvedValue({
      id: 10,
      content: 'New dare',
      theme: 'general',
      source: 'perchance',
    });
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: {
        user: 'user456',
        random: true,
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dare.id).toBe(10);
    expect(mockDareService.getRandomDare).toHaveBeenCalled();
    expect(mockDareService.generateDareFromPerchance).toHaveBeenCalled();
  });

  it('should return error when user is missing', async () => {
    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Target user is required');
  });

  it('should handle service error', async () => {
    mockDareService.generateDareFromPerchance.mockRejectedValue(new Error('Service error'));

    const command = {
      userId: 'user123',
      metadata: {
        user: 'user456',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Service error');
  });

  it('should handle random as string "true"', async () => {
    const existingDare = {
      id: 3,
      content: 'Test dare',
      theme: 'general',
    };
    mockDareService.getRandomDare.mockResolvedValue(existingDare);
    mockDareService.assignDare.mockResolvedValue(true);

    const command = {
      userId: 'user123',
      metadata: {
        user: 'user456',
        random: 'true',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockDareService.getRandomDare).toHaveBeenCalled();
  });
});
