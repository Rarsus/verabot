const AddQuoteHandler = require('../../../../src/app/handlers/quotes/AddQuoteHandler');

describe('AddQuoteHandler', () => {
  let handler;
  let mockQuoteService;

  beforeEach(() => {
    mockQuoteService = {
      addQuote: jest.fn(),
    };
    handler = new AddQuoteHandler(mockQuoteService);
  });

  it('should add a quote successfully', async () => {
    mockQuoteService.addQuote.mockResolvedValue(1);

    const command = {
      userId: 'user123',
      metadata: {
        text: 'Test quote',
        author: 'Test Author',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.data.quoteId).toBe(1);
    expect(result.data.message).toBe('Quote #1 added successfully!');
    expect(mockQuoteService.addQuote).toHaveBeenCalledWith('Test quote', 'Test Author', 'user123');
  });

  it('should use Anonymous as default author', async () => {
    mockQuoteService.addQuote.mockResolvedValue(1);

    const command = {
      userId: 'user123',
      metadata: {
        text: 'Test quote',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(mockQuoteService.addQuote).toHaveBeenCalledWith('Test quote', 'Anonymous', 'user123');
  });

  it('should return error when text is missing', async () => {
    const command = {
      userId: 'user123',
      metadata: {},
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote text is required');
  });

  it('should return error when service throws', async () => {
    mockQuoteService.addQuote.mockRejectedValue(new Error('Database error'));

    const command = {
      userId: 'user123',
      metadata: {
        text: 'Test quote',
      },
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
