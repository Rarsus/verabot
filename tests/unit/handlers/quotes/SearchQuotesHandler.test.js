const SearchQuotesHandler = require('../../../../src/app/handlers/quotes/SearchQuotesHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('SearchQuotesHandler', () => {
  let handler;
  let quoteServiceMock;

  beforeEach(() => {
    quoteServiceMock = {
      searchQuotes: jest.fn(),
    };
    handler = new SearchQuotesHandler(quoteServiceMock);
  });

  describe('handle', () => {
    it('should return error when search query is not provided', async () => {
      const command = {
        name: 'search-quotes',
        metadata: {},
      };

      const result = await handler.handle(command);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Search query is required');
    });

    it('should return error when no quotes are found', async () => {
      const command = {
        name: 'search-quotes',
        metadata: { query: 'nonexistent' },
      };

      quoteServiceMock.searchQuotes.mockResolvedValue([]);

      const result = await handler.handle(command);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('No quotes found matching "nonexistent"');
      expect(quoteServiceMock.searchQuotes).toHaveBeenCalledWith('nonexistent');
    });

    it('should return error when search returns null', async () => {
      const command = {
        name: 'search-quotes',
        metadata: { query: 'test' },
      };

      quoteServiceMock.searchQuotes.mockResolvedValue(null);

      const result = await handler.handle(command);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('No quotes found matching "test"');
    });

    it('should return single matching quote', async () => {
      const quotes = [
        {
          id: 1,
          text: 'Life is beautiful',
          author: 'Jane Doe',
        },
      ];

      const command = {
        name: 'search-quotes',
        metadata: { query: 'beautiful' },
      };

      quoteServiceMock.searchQuotes.mockResolvedValue(quotes);

      const result = await handler.handle(command);

      expect(result.success).toBe(true);
      expect(result.data.quotes).toEqual(quotes);
      expect(result.data.count).toBe(1);
      expect(result.data.message).toBe('Found 1 quote matching "beautiful"');
      expect(result.data.query).toBe('beautiful');
      expect(quoteServiceMock.searchQuotes).toHaveBeenCalledWith('beautiful');
    });

    it('should return multiple matching quotes', async () => {
      const quotes = [
        {
          id: 1,
          text: 'The journey begins',
          author: 'Author 1',
        },
        {
          id: 2,
          text: 'The end is near',
          author: 'Author 2',
        },
        {
          id: 3,
          text: 'The truth is out there',
          author: 'Author 3',
        },
      ];

      const command = {
        name: 'search-quotes',
        metadata: { query: 'the' },
      };

      quoteServiceMock.searchQuotes.mockResolvedValue(quotes);

      const result = await handler.handle(command);

      expect(result.success).toBe(true);
      expect(result.data.quotes).toEqual(quotes);
      expect(result.data.count).toBe(3);
      expect(result.data.message).toBe('Found 3 quotes matching "the"');
      expect(quoteServiceMock.searchQuotes).toHaveBeenCalledWith('the');
    });

    it('should handle whitespace in search query', async () => {
      const quotes = [{ id: 1, text: 'test quote', author: 'test' }];

      const command = {
        name: 'search-quotes',
        metadata: { query: '  query  ' },
      };

      quoteServiceMock.searchQuotes.mockResolvedValue(quotes);

      const result = await handler.handle(command);

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('  query  ');
      expect(quoteServiceMock.searchQuotes).toHaveBeenCalledWith('  query  ');
    });

    it('should handle service errors', async () => {
      const command = {
        name: 'search-quotes',
        metadata: { query: 'test' },
      };

      const error = new Error('Database connection failed');
      quoteServiceMock.searchQuotes.mockRejectedValue(error);

      await expect(handler.handle(command)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
