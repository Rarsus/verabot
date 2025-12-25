/**
 * Dare Service
 * Handles business logic for dare operations with Perchance integration
 * @class DareService
 * @example
 * const dareService = new DareService(dareRepo, perchanceService);
 * const dare = await dareService.createDare('funny', 'user123');
 */

// Validation constants
const MAX_DARE_CONTENT_LENGTH = 500;
const MAX_COMPLETION_NOTES_LENGTH = 1000;
const VALID_STATUSES = ['active', 'completed', 'archived'];

class DareService {
  /**
   * Create a new DareService instance
   * @param {Object} dareRepo - Dare repository with database methods
   * @param {Object} perchanceService - Perchance service for AI generation
   */
  constructor(dareRepo, perchanceService) {
    /** @type {Object} */
    this.dareRepo = dareRepo;
    /** @type {Object} */
    this.perchanceService = perchanceService;
  }

  /**
   * Generate a new dare using Perchance and store it
   * @param {string} [theme='general'] - Dare theme
   * @param {string} createdBy - User ID who created the dare
   * @returns {Promise<Object>} Created dare with ID
   */
  async generateDareFromPerchance(theme = 'general', createdBy = null) {
    // Generate dare using Perchance
    const generated = await this.perchanceService.generateDare(theme);

    // Store in database
    const dareId = await this.dareRepo.add(
      generated.content,
      generated.source,
      createdBy,
      generated.theme,
    );

    return {
      id: dareId,
      content: generated.content,
      source: generated.source,
      theme: generated.theme,
      created_by: createdBy,
      status: 'active',
    };
  }

  /**
   * Create a dare manually (user-provided content)
   * @param {string} content - Dare content
   * @param {string} createdBy - User ID who created the dare
   * @param {string} [theme] - Optional theme
   * @returns {Promise<number>} The ID of the newly created dare
   */
  async createDare(content, createdBy, theme = null) {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Dare content cannot be empty');
    }
    if (content.length > MAX_DARE_CONTENT_LENGTH) {
      throw new Error(`Dare content is too long (maximum ${MAX_DARE_CONTENT_LENGTH} characters)`);
    }

    return await this.dareRepo.add(content.trim(), 'user', createdBy, theme);
  }

  /**
   * Get all dares with optional filtering
   * @param {Object} [options] - Query options
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.theme] - Filter by theme
   * @param {number} [options.page] - Page number (1-indexed)
   * @param {number} [options.perPage] - Items per page
   * @returns {Promise<Object>} Dares array with pagination info
   */
  async getAllDares(options = {}) {
    const page = options.page || 1;
    const perPage = options.perPage || 20;
    const offset = (page - 1) * perPage;

    const filters = {
      status: options.status,
      theme: options.theme,
      limit: perPage,
      offset,
    };

    const dares = await this.dareRepo.getAll(filters);
    const total = await this.dareRepo.count({ status: options.status });

    return {
      dares,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
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
   * @param {Object} [options] - Filter options
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.theme] - Filter by theme
   * @returns {Promise<Object|null>} Random dare object or null if no dares exist
   */
  async getRandomDare(options = {}) {
    return await this.dareRepo.getRandom({
      status: options.status || 'active',
      theme: options.theme,
    });
  }

  /**
   * Update a dare
   * @param {number} id - Dare ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} True if update successful
   */
  async updateDare(id, updates) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    // Validate updates
    if (updates.content !== undefined) {
      if (updates.content.length === 0) {
        throw new Error('Dare content cannot be empty');
      }
      if (updates.content.length > MAX_DARE_CONTENT_LENGTH) {
        throw new Error(
          `Dare content is too long (maximum ${MAX_DARE_CONTENT_LENGTH} characters)`,
        );
      }
    }

    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    return await this.dareRepo.update(id, updates);
  }

  /**
   * Delete a dare
   * @param {number} id - Dare ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  async deleteDare(id) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    const dare = await this.dareRepo.getById(id);
    if (!dare) {
      throw new Error('Dare not found');
    }

    return await this.dareRepo.delete(id);
  }

  /**
   * Complete a dare
   * @param {number} id - Dare ID
   * @param {string} [notes] - Completion notes
   * @returns {Promise<boolean>} True if update successful
   */
  async completeDare(id, notes = null) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }

    if (notes && notes.length > MAX_COMPLETION_NOTES_LENGTH) {
      throw new Error(
        `Completion notes are too long (maximum ${MAX_COMPLETION_NOTES_LENGTH} characters)`,
      );
    }

    const dare = await this.dareRepo.getById(id);
    if (!dare) {
      throw new Error('Dare not found');
    }

    if (dare.status === 'completed') {
      throw new Error('Dare is already completed');
    }

    return await this.dareRepo.complete(id, notes);
  }

  /**
   * Assign a dare to a user
   * @param {number} id - Dare ID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<boolean>} True if assignment successful
   */
  async assignDare(id, userId) {
    if (!id || id < 1) {
      throw new Error('Invalid dare ID');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.dareRepo.update(id, { assigned_to: userId });
  }

  /**
   * Get the total count of dares
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @returns {Promise<number>} Total number of dares
   */
  async getDareCount(filters = {}) {
    return await this.dareRepo.count(filters);
  }

  /**
   * Get available themes from Perchance service
   * @returns {Array<string>} Array of theme names
   */
  getAvailableThemes() {
    return this.perchanceService.getAvailableThemes();
  }
}

module.exports = DareService;
