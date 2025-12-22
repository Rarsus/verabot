const QuoteService = require('../../../src/core/services/QuoteService');

describe('QuoteService', () => {
  let quoteService;
  let mockQuoteRepo;

  beforeEach(() => {
    mockQuoteRepo = {
      add: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      getRandom: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
    };
    quoteService = new QuoteService(mockQuoteRepo);
  });

  describe('addQuote', () => {
    it('should add a quote successfully', async () => {
      mockQuoteRepo.add.mockResolvedValue(1);

      const result = await quoteService.addQuote('Test quote', 'Test Author', 'user123');

      expect(result).toBe(1);
      expect(mockQuoteRepo.add).toHaveBeenCalledWith('Test quote', 'Test Author', 'user123');
    });

    it('should use default author when not provided', async () => {
      mockQuoteRepo.add.mockResolvedValue(1);

      await quoteService.addQuote('Test quote', undefined, 'user123');

      expect(mockQuoteRepo.add).toHaveBeenCalledWith('Test quote', 'Anonymous', 'user123');
    });

    it('should trim whitespace from text and author', async () => {
      mockQuoteRepo.add.mockResolvedValue(1);

      await quoteService.addQuote('  Test quote  ', '  Test Author  ', 'user123');

      expect(mockQuoteRepo.add).toHaveBeenCalledWith('Test quote', 'Test Author', 'user123');
    });

    it('should throw error for empty quote text', async () => {
      await expect(quoteService.addQuote('', 'Author', 'user123')).rejects.toThrow(
        'Quote text cannot be empty',
      );
    });

    it('should throw error for quote text that is too long', async () => {
      const longText = 'a'.repeat(1001);
      await expect(quoteService.addQuote(longText, 'Author', 'user123')).rejects.toThrow(
        'Quote text is too long',
      );
    });

    it('should throw error for author name that is too long', async () => {
      const longAuthor = 'a'.repeat(201);
      await expect(quoteService.addQuote('Text', longAuthor, 'user123')).rejects.toThrow(
        'Author name is too long',
      );
    });
  });

  describe('getAllQuotes', () => {
    it('should return all quotes', async () => {
      const mockQuotes = [
        { id: 1, text: 'Quote 1', author: 'Author 1' },
        { id: 2, text: 'Quote 2', author: 'Author 2' },
      ];
      mockQuoteRepo.getAll.mockResolvedValue(mockQuotes);

      const result = await quoteService.getAllQuotes();

      expect(result).toEqual(mockQuotes);
      expect(mockQuoteRepo.getAll).toHaveBeenCalled();
    });
  });

  describe('getQuoteById', () => {
    it('should return quote by id', async () => {
      const mockQuote = { id: 1, text: 'Test quote', author: 'Test Author' };
      mockQuoteRepo.getById.mockResolvedValue(mockQuote);

      const result = await quoteService.getQuoteById(1);

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepo.getById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(quoteService.getQuoteById(0)).rejects.toThrow('Invalid quote ID');
      await expect(quoteService.getQuoteById(-1)).rejects.toThrow('Invalid quote ID');
    });
  });

  describe('getRandomQuote', () => {
    it('should return a random quote', async () => {
      const mockQuote = { id: 1, text: 'Random quote', author: 'Random Author' };
      mockQuoteRepo.getRandom.mockResolvedValue(mockQuote);

      const result = await quoteService.getRandomQuote();

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepo.getRandom).toHaveBeenCalled();
    });
  });

  describe('searchQuotes', () => {
    it('should search quotes successfully', async () => {
      const mockQuotes = [{ id: 1, text: 'Test quote', author: 'Test Author' }];
      mockQuoteRepo.search.mockResolvedValue(mockQuotes);

      const result = await quoteService.searchQuotes('test');

      expect(result).toEqual(mockQuotes);
      expect(mockQuoteRepo.search).toHaveBeenCalledWith('test');
    });

    it('should trim whitespace from search query', async () => {
      mockQuoteRepo.search.mockResolvedValue([]);

      await quoteService.searchQuotes('  test  ');

      expect(mockQuoteRepo.search).toHaveBeenCalledWith('test');
    });

    it('should throw error for empty search query', async () => {
      await expect(quoteService.searchQuotes('')).rejects.toThrow('Search query cannot be empty');
    });
  });

  describe('getQuoteCount', () => {
    it('should return quote count', async () => {
      mockQuoteRepo.count.mockResolvedValue(42);

      const result = await quoteService.getQuoteCount();

      expect(result).toBe(42);
      expect(mockQuoteRepo.count).toHaveBeenCalled();
    });
  });
});
