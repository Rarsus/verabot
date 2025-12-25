const ListDaresHandler = require('../../../../src/app/handlers/dares/ListDaresHandler');

describe('ListDaresHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getAllDares: jest.fn(),
      getDareCount: jest.fn(),
    };
    handler = new ListDaresHandler(mockDareService);
  });

  it('should list all dares successfully with pagination', async () => {
    const mockDares = [
      { id: 1, content: 'Dare 1', status: 'active' },
      { id: 2, content: 'Dare 2', status: 'completed' },
    ];
    mockDareService.getAllDares.mockResolvedValue(mockDares);
    mockDareService.getDareCount.mockResolvedValue(15);

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dares).toEqual(mockDares);
    expect(result.data.count).toBe(2);
    expect(result.data.totalCount).toBe(15);
    expect(result.data.page).toBe(1);
    expect(result.data.perPage).toBe(10);
    expect(result.data.totalPages).toBe(2);
    expect(result.data.message).toContain('Found 2 dares');
    expect(result.data.message).toContain('page 1/2');
    expect(result.data.message).toContain('total 15');
  });

  it('should handle status filter', async () => {
    mockDareService.getAllDares.mockResolvedValue([{ id: 1, content: 'Dare 1' }]);
    mockDareService.getDareCount.mockResolvedValue(1);

    const command = {
      metadata: { status: 'active' },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', perPage: 10 }),
    );
    expect(mockDareService.getDareCount).toHaveBeenCalledWith({ status: 'active' });
  });

  it('should handle theme filter', async () => {
    mockDareService.getAllDares.mockResolvedValue([{ id: 1, content: 'Dare 1' }]);
    mockDareService.getDareCount.mockResolvedValue(1);

    const command = {
      metadata: { theme: 'humiliating' },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'humiliating' }),
    );
    expect(mockDareService.getDareCount).toHaveBeenCalledWith({ theme: 'humiliating' });
  });

  it('should handle page filter', async () => {
    mockDareService.getAllDares.mockResolvedValue([{ id: 11, content: 'Dare 11' }]);
    mockDareService.getDareCount.mockResolvedValue(15);

    const command = {
      metadata: { page: '2' },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('should return error when no dares available', async () => {
    mockDareService.getAllDares.mockResolvedValue([]);
    mockDareService.getDareCount.mockResolvedValue(0);

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('No dares available');
  });

  it('should return error when service fails', async () => {
    mockDareService.getAllDares.mockRejectedValue(new Error('Database error'));

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });

  it('should handle singular dare count', async () => {
    mockDareService.getAllDares.mockResolvedValue([{ id: 1, content: 'Dare 1' }]);
    mockDareService.getDareCount.mockResolvedValue(1);

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.data.message).toContain('Found 1 dare');
  });
});
