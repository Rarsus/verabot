const QuoteHandler = require('../../../../src/app/handlers/quotes/QuoteHandler');
const CommandResult = require('../../../../src/core/commands/CommandResult');

describe('QuoteHandler', () => {
  let handler;
  let quoteServiceMock;

  beforeEach(() => {
    quoteServiceMock = {
      getQuoteById: jest.fn(),
    };
    handler = new QuoteHandler(quoteServiceMock);
  });

  describe('handle', () => {
    it('should return error when quote ID is not provided', async () => {
      const command = {
        name: 'quote',
        metadata: {},
      };

      const result = await handler.handle(command);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Quote ID is required');
    });

    it('should return error when quote is not found', async () => {
      const command = {
        name: 'quote',
        metadata: { id: 999 },
      };

      quoteServiceMock.getQuoteById.mockResolvedValue(null);

      const result = await handler.handle(command);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Quote #999 not found');
      expect(quoteServiceMock.getQuoteById).toHaveBeenCalledWith(999);
    });

    it('should return quote when found', async () => {
      const quote = {
        id: 1,
        text: 'Life is a journey',
        author: 'John Doe',
      };

      const command = {
        name: 'quote',
        metadata: { id: 1 },
      };

      quoteServiceMock.getQuoteById.mockResolvedValue(quote);

      const result = await handler.handle(command);

      expect(result.success).toBe(true);
      expect(result.data.quote).toEqual(quote);
      expect(result.data.formatted).toBe('> Life is a journey\n— John Doe');
      expect(quoteServiceMock.getQuoteById).toHaveBeenCalledWith(1);
    });

    it('should format quote correctly with different text', async () => {
      const quote = {
        id: 5,
        text: 'The quick brown fox jumps',
        author: 'Anonymous',
      };

      const command = {
        name: 'quote',
        metadata: { id: 5 },
      };

      quoteServiceMock.getQuoteById.mockResolvedValue(quote);

      const result = await handler.handle(command);

      expect(result.data.formatted).toBe(
        '> The quick brown fox jumps\n— Anonymous',
      );
    });

    it('should handle service errors', async () => {
      const command = {
        name: 'quote',
        metadata: { id: 1 },
      };

      const error = new Error('Database connection failed');
      quoteServiceMock.getQuoteById.mockRejectedValue(error);

      await expect(handler.handle(command)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
