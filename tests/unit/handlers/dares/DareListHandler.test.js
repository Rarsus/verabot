const DareListHandler = require('../../../../src/app/handlers/dares/DareListHandler');

describe('DareListHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getAllDares: jest.fn(),
    };
    handler = new DareListHandler(mockDareService);
  });

  it('should list dares successfully', async () => {
    const mockDares = [
      { id: 1, content: 'Dare 1', status: 'active' },
      { id: 2, content: 'Dare 2', status: 'active' },
    ];
    mockDareService.getAllDares.mockResolvedValue({
      dares: mockDares,
      pagination: {
        page: 1,
        perPage: 20,
        total: 2,
        totalPages: 1,
      },
    });

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dares).toEqual(mockDares);
    expect(result.data.pagination.total).toBe(2);
    expect(result.data.message).toBe('Found 2 dares (Page 1 of 1)');
  });

  it('should handle pagination', async () => {
    mockDareService.getAllDares.mockResolvedValue({
      dares: [],
      pagination: {
        page: 2,
        perPage: 10,
        total: 15,
        totalPages: 2,
      },
    });

    const command = {
      metadata: {
        page: 2,
        perPage: 10,
      },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
      status: undefined,
      theme: undefined,
    });
  });

  it('should filter by status and theme', async () => {
    mockDareService.getAllDares.mockResolvedValue({
      dares: [{ id: 1, content: 'Active dare', status: 'active', theme: 'funny' }],
      pagination: {
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const command = {
      metadata: {
        status: 'active',
        theme: 'funny',
      },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith({
      page: 1,
      perPage: 20,
      status: 'active',
      theme: 'funny',
    });
  });

  it('should return error when no dares available', async () => {
    mockDareService.getAllDares.mockResolvedValue({
      dares: [],
      pagination: {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      },
    });

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('No dares available');
  });

  it('should handle service error', async () => {
    mockDareService.getAllDares.mockRejectedValue(new Error('Database error'));

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Database error');
  });
});
