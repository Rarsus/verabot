const ListDaresHandler = require('../../../../src/app/handlers/dares/ListDaresHandler');

describe('ListDaresHandler', () => {
  let handler;
  let mockDareService;

  beforeEach(() => {
    mockDareService = {
      getAllDares: jest.fn(),
    };
    handler = new ListDaresHandler(mockDareService);
  });

  it('should list all dares successfully', async () => {
    const mockDares = [
      { id: 1, content: 'Dare 1', status: 'active' },
      { id: 2, content: 'Dare 2', status: 'completed' },
    ];
    mockDareService.getAllDares.mockResolvedValue(mockDares);

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.dares).toEqual(mockDares);
    expect(result.data.count).toBe(2);
    expect(result.data.message).toBe('Found 2 dares');
  });

  it('should handle status filter', async () => {
    mockDareService.getAllDares.mockResolvedValue([{ id: 1, content: 'Dare 1' }]);

    const command = {
      metadata: { status: 'active' },
    };

    await handler.handle(command);

    expect(mockDareService.getAllDares).toHaveBeenCalledWith({ status: 'active' });
  });

  it('should return error when no dares available', async () => {
    mockDareService.getAllDares.mockResolvedValue([]);

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

    const command = {
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.data.message).toBe('Found 1 dare');
  });
});
