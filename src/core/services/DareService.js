/**
 * Dare Service
 * Handles business logic for dare operations including Perchance API integration
 * Supports themes, caching, and fallback mechanisms
 * @class DareService
 * @example
 * const dareService = new DareService(dareRepo, perchanceService, config, logger);
 * const dare = await dareService.createDare('user123', 'humiliating');
 */

// Validation constants
const MAX_DARE_CONTENT_LENGTH = 2000;

class DareService {
  /**
   * Create a new DareService instance
   * @param {Object} dareRepo - Dare repository with database methods
   * @param {Object} perchanceService - Perchance API service
   * @param {Object} config - Application configuration
   * @param {Object} logger - Logger instance
   */
  constructor(dareRepo, perchanceService, config, logger) {
    /** @type {Object} */
    this.dareRepo = dareRepo;
    /** @type {Object} */
    this.perchanceService = perchanceService;
    /** @type {Object} */
    this.config = config;
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Create a new dare (generate from Perchance and store in database)
   * @param {string} createdBy - User ID who created the dare
   * @param {string} [theme] - Theme/category for the dare (defaults to 'general')
   * @param {string} [generatorOverride] - Override generator name (optional)
   * @returns {Promise<Object>} The created dare object with id and content
   */
  async createDare(createdBy, theme = 'general', generatorOverride = null) {
    // Validate theme
    if (!this.config.DARE_THEMES.includes(theme)) {
      throw new Error(
        `Invalid theme '${theme}'. Must be one of: ${this.config.DARE_THEMES.join(', ')}`,
      );
    }

    // Determine generator to use (command override > env var > config default)
    const generator = generatorOverride || this.config.PERCHANCE_DARE_GENERATOR;

    let content;
    try {
      // Try to generate from Perchance API
      content = await this.perchanceService.generateDare(generator, theme);
    } catch (err) {
      this.logger.error({ err, generator, theme }, 'Failed to generate dare from Perchance API');

      // Fallback: try to get a random existing dare from the same theme
      const fallbackDare = await this.dareRepo.getRandom({ status: 'active', theme });
      if (fallbackDare) {
        this.logger.info({ theme }, 'Using fallback dare from database');
        // Return existing dare without creating duplicate
        return {
          id: fallbackDare.id,
          content: fallbackDare.content,
          theme: fallbackDare.theme,
          source: 'database_fallback',
          created_by: fallbackDare.created_by,
          status: fallbackDare.status,
          fallback: true,
        };
      }

      // No fallback available
      throw new Error(
        'Failed to generate dare from Perchance API and no fallback dares available. Please try again later.',
      );
    }

    // Validate content length
    if (content.length > MAX_DARE_CONTENT_LENGTH) {
      this.logger.warn({ length: content.length }, 'Generated dare too long, truncating');
      content = content.substring(0, MAX_DARE_CONTENT_LENGTH);
    }

    // Store in database
    const dareId = await this.dareRepo.add(content, theme, 'perchance', createdBy);

    // Return the created dare
    return {
      id: dareId,
      content,
      theme,
      source: 'perchance',
      created_by: createdBy,
      status: 'active',
    };
  }

  /**
   * Add a user-created dare (not from Perchance)
   * @param {string} content - Dare content text
   * @param {string} theme - Theme/category for the dare
   * @param {string} createdBy - User ID who created the dare
   * @returns {Promise<number>} The ID of the newly created dare
   */
  async addDare(content, theme, createdBy) {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Dare content cannot be empty');
    }
    if (content.length > MAX_DARE_CONTENT_LENGTH) {
      throw new Error(`Dare content is too long (maximum ${MAX_DARE_CONTENT_LENGTH} characters)`);
    }
    if (!this.config.DARE_THEMES.includes(theme)) {
      throw new Error(
        `Invalid theme '${theme}'. Must be one of: ${this.config.DARE_THEMES.join(', ')}`,
      );
    }

    return await this.dareRepo.add(content.trim(), theme, 'user', createdBy);
  }

  /**
   * Get all dares
   * @param {Object} filters - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.assignedTo] - Filter by assigned user
   * @param {string} [filters.theme] - Filter by theme
   * @param {number} [filters.page] - Page number (default: 1)
   * @param {number} [filters.perPage] - Items per page (default: 10)
   * @returns {Promise<Array>} Array of dares
   */
  async getAllDares(filters = {}) {
    return await this.dareRepo.getAll(filters);
  }

  /**
   * Get a dare by ID
   * @param {number} id - Dare ID
   * @returns {Promise<Object|null>} Dare object or null if not found
   */
  async getDareById(id) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }
    return await this.dareRepo.getById(id);
  }

  /**
   * Get a random dare
   * @param {Object} filters - Optional filters
   * @param {string} [filters.status] - Filter by status (default: 'active')
   * @param {string} [filters.theme] - Filter by theme
   * @returns {Promise<Object|null>} Random dare object or null if no dares exist
   */
  async getRandomDare(filters = {}) {
    // Default to active dares only
    if (!filters.status) {
      filters.status = 'active';
    }
    return await this.dareRepo.getRandom(filters);
  }

  /**
   * Update a dare
   * @param {number} id - Dare ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.content] - New content
   * @param {string} [updates.status] - New status ('active', 'completed', 'archived')
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async updateDare(id, updates) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['active', 'completed', 'archived'];
      if (!validStatuses.includes(updates.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate content length if provided
    if (updates.content && updates.content.length > MAX_DARE_CONTENT_LENGTH) {
      throw new Error(`Dare content is too long (maximum ${MAX_DARE_CONTENT_LENGTH} characters)`);
    }

    const updated = await this.dareRepo.update(id, updates);
    if (!updated) {
      throw new Error('Dare not found');
    }
    return true;
  }

  /**
   * Delete a dare
   * @param {number} id - Dare ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteDare(id) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    const deleted = await this.dareRepo.delete(id);
    if (!deleted) {
      throw new Error('Dare not found');
    }
    return true;
  }

  /**
   * Assign a dare to a user
   * @param {number} id - Dare ID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<boolean>} True if assigned
   */
  async assignDare(id, userId) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.updateDare(id, {
      assignedTo: userId,
      assignedAt: new Date().toISOString(),
    });
  }

  /**
   * Complete a dare
   * @param {number} id - Dare ID
   * @param {string} userId - User ID who completed it
   * @param {string} [notes] - Optional completion notes
   * @returns {Promise<boolean>} True if completed
   */
  async completeDare(id, userId, notes = null) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    // Verify the dare exists and is assigned to this user
    const dare = await this.getDareById(id);
    if (!dare) {
      throw new Error('Dare not found');
    }

    if (dare.assigned_to && dare.assigned_to !== userId) {
      throw new Error('You can only complete dares assigned to you');
    }

    // Mark as completed
    const updates = {
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    if (notes) {
      updates.completionNotes = notes;
    }

    return await this.updateDare(id, updates);
  }

  /**
   * Get the total count of dares
   * @param {Object} filters - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.theme] - Filter by theme
   * @returns {Promise<number>} Total number of dares
   */
  async getDareCount(filters = {}) {
    return await this.dareRepo.count(filters);
  }

  /**
   * Get available themes
   * @returns {Array<string>} List of available themes
   */
  getAvailableThemes() {
    return [...this.config.DARE_THEMES];
  }
}

module.exports = DareService;
