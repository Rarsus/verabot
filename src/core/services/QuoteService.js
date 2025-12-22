/**
 * Quote Service
 * Handles business logic for quote operations
 * @class QuoteService
 * @example
 * const quoteService = new QuoteService(quoteRepo);
 * const quote = await quoteService.getRandomQuote();
 */

// Validation constants
const MAX_QUOTE_TEXT_LENGTH = 1000;
const MAX_AUTHOR_LENGTH = 200;

class QuoteService {
  /**
   * Create a new QuoteService instance
   * @param {Object} quoteRepo - Quote repository with database methods
   */
  constructor(quoteRepo) {
    /** @type {Object} */
    this.quoteRepo = quoteRepo;
  }

  /**
   * Add a new quote
   * @param {string} text - Quote text
   * @param {string} author - Quote author
   * @param {string} addedBy - User ID who added the quote
   * @returns {Promise<number>} The ID of the newly created quote
   */
  async addQuote(text, author = 'Anonymous', addedBy = null) {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Quote text cannot be empty');
    }
    if (text.length > MAX_QUOTE_TEXT_LENGTH) {
      throw new Error(`Quote text is too long (maximum ${MAX_QUOTE_TEXT_LENGTH} characters)`);
    }
    if (author && author.length > MAX_AUTHOR_LENGTH) {
      throw new Error(`Author name is too long (maximum ${MAX_AUTHOR_LENGTH} characters)`);
    }

    return await this.quoteRepo.add(text.trim(), author.trim(), addedBy);
  }

  /**
   * Get all quotes
   * @returns {Promise<Array>} Array of all quotes
   */
  async getAllQuotes() {
    return await this.quoteRepo.getAll();
  }

  /**
   * Get a quote by ID
   * @param {number} id - Quote ID
   * @returns {Promise<Object|null>} Quote object or null if not found
   */
  async getQuoteById(id) {
    if (!id || id < 1) {
      throw new Error('Invalid quote ID');
    }
    return await this.quoteRepo.getById(id);
  }

  /**
   * Get a random quote
   * @returns {Promise<Object|null>} Random quote object or null if no quotes exist
   */
  async getRandomQuote() {
    return await this.quoteRepo.getRandom();
  }

  /**
   * Search quotes by text or author
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching quotes
   */
  async searchQuotes(query) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }
    return await this.quoteRepo.search(query.trim());
  }

  /**
   * Get the total count of quotes
   * @returns {Promise<number>} Total number of quotes
   */
  async getQuoteCount() {
    return await this.quoteRepo.count();
  }
}

module.exports = QuoteService;
