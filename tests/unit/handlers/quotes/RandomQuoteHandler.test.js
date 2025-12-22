const RandomQuoteHandler = require('../../../../src/app/handlers/quotes/RandomQuoteHandler');

describe('RandomQuoteHandler', () => {
  let handler;
  let mockQuoteService;

  beforeEach(() => {
    mockQuoteService = {
      getRandomQuote: jest.fn(),
    };
    handler = new RandomQuoteHandler(mockQuoteService);
  });

  it('should return a random quote', async () => {
    const mockQuote = { id: 1, text: 'Random quote', author: 'Random Author' };
    mockQuoteService.getRandomQuote.mockResolvedValue(mockQuote);

    const result = await handler.handle();

    expect(result.success).toBe(true);
    expect(result.data.quote).toEqual(mockQuote);
    expect(result.data.formatted).toBe('> Random quote\n— Random Author');
  });

  it('should return error when no quotes available', async () => {
    mockQuoteService.getRandomQuote.mockResolvedValue(null);

    const result = await handler.handle();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('No quotes available');
  });

  it('should propagate service errors', async () => {
    mockQuoteService.getRandomQuote.mockRejectedValue(new Error('Database error'));

    await expect(handler.handle()).rejects.toThrow('Database error');
  });
});
