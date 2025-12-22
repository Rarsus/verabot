const ListQuotesHandler = require('../../../../src/app/handlers/quotes/ListQuotesHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('ListQuotesHandler', () => {
  let handler;
  let quoteServiceMock;

  beforeEach(() => {
    quoteServiceMock = {
      getAllQuotes: jest.fn(),
    };
    handler = new ListQuotesHandler(quoteServiceMock);
  });

  describe('handle', () => {
    it('should return error when no quotes are available', async () => {
      quoteServiceMock.getAllQuotes.mockResolvedValue([]);

      const result = await handler.handle();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('No quotes available');
      expect(quoteServiceMock.getAllQuotes).toHaveBeenCalled();
    });

    it('should return error when quotes is null', async () => {
      quoteServiceMock.getAllQuotes.mockResolvedValue(null);

      const result = await handler.handle();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('No quotes available');
    });

    it('should return single quote', async () => {
      const quotes = [
        {
          id: 1,
          text: 'Life is beautiful',
          author: 'Jane Doe',
        },
      ];

      quoteServiceMock.getAllQuotes.mockResolvedValue(quotes);

      const result = await handler.handle();

      expect(result.success).toBe(true);
      expect(result.data.quotes).toEqual(quotes);
      expect(result.data.count).toBe(1);
      expect(result.data.message).toBe('Found 1 quote');
    });

    it('should return multiple quotes', async () => {
      const quotes = [
        {
          id: 1,
          text: 'Quote 1',
          author: 'Author 1',
        },
        {
          id: 2,
          text: 'Quote 2',
          author: 'Author 2',
        },
        {
          id: 3,
          text: 'Quote 3',
          author: 'Author 3',
        },
      ];

      quoteServiceMock.getAllQuotes.mockResolvedValue(quotes);

      const result = await handler.handle();

      expect(result.success).toBe(true);
      expect(result.data.quotes).toEqual(quotes);
      expect(result.data.count).toBe(3);
      expect(result.data.message).toBe('Found 3 quotes');
    });

    it('should format message correctly for multiple quotes', async () => {
      const quotes = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        text: `Quote ${i + 1}`,
        author: `Author ${i + 1}`,
      }));

      quoteServiceMock.getAllQuotes.mockResolvedValue(quotes);

      const result = await handler.handle();

      expect(result.data.message).toBe('Found 5 quotes');
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      quoteServiceMock.getAllQuotes.mockRejectedValue(error);

      await expect(handler.handle()).rejects.toThrow('Database error');
    });

    it('should work without command parameter', async () => {
      const quotes = [{ id: 1, text: 'test', author: 'test' }];
      quoteServiceMock.getAllQuotes.mockResolvedValue(quotes);

      // Call without parameter
      const result = await handler.handle();

      expect(result.success).toBe(true);
      expect(result.data.quotes).toEqual(quotes);
    });
  });
});
