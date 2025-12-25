/**
 * Dare Service
 * Handles business logic for dare operations including Perchance API integration
 * @class DareService
 * @example
 * const dareService = new DareService(dareRepo, logger);
 * const dare = await dareService.createDare('user123');
 */

// Validation constants
const MAX_DARE_CONTENT_LENGTH = 2000;
const PERCHANCE_API_URL = 'https://perchance.org/api/generate';
const PERCHANCE_GENERATOR = 'dares';

class DareService {
  /**
   * Create a new DareService instance
   * @param {Object} dareRepo - Dare repository with database methods
   * @param {Object} logger - Logger instance
   */
  constructor(dareRepo, logger) {
    /** @type {Object} */
    this.dareRepo = dareRepo;
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Generate a dare from Perchance API
   * @returns {Promise<string>} Generated dare content
   * @private
   */
  async generateDareFromPerchance() {
    try {
      // Perchance API call - using the dare generator
      const response = await fetch(`${PERCHANCE_API_URL}?generator=${PERCHANCE_GENERATOR}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn({ status: response.status }, 'Perchance API returned non-OK status');
        throw new Error(`Perchance API error: ${response.status}`);
      }

      const data = await response.json();

      // Perchance API returns different formats depending on the generator
      // Typically returns { result: "dare text" } or { output: "dare text" }
      const dareContent = data.result || data.output || data.text;

      if (!dareContent) {
        this.logger.error({ data }, 'Perchance API returned unexpected format');
        throw new Error('Failed to extract dare from Perchance API response');
      }

      return dareContent;
    } catch (err) {
      this.logger.error({ err }, 'Failed to generate dare from Perchance');
      throw new Error('Failed to generate dare from external API. Please try again later.');
    }
  }

  /**
   * Create a new dare (generate from Perchance and store in database)
   * @param {string} createdBy - User ID who created the dare
   * @returns {Promise<Object>} The created dare object with id and content
   */
  async createDare(createdBy) {
    // Generate dare from Perchance
    let content = await this.generateDareFromPerchance();

    // Validate content length (shouldn't be an issue with Perchance, but defensive)
    if (content.length > MAX_DARE_CONTENT_LENGTH) {
      this.logger.warn({ length: content.length }, 'Generated dare too long, truncating');
      content = content.substring(0, MAX_DARE_CONTENT_LENGTH);
    }

    // Store in database
    const dareId = await this.dareRepo.add(content, 'perchance', createdBy);

    // Return the created dare
    return {
      id: dareId,
      content,
      source: 'perchance',
      created_by: createdBy,
      status: 'active',
    };
  }

  /**
   * Add a user-created dare (not from Perchance)
   * @param {string} content - Dare content text
   * @param {string} createdBy - User ID who created the dare
   * @returns {Promise<number>} The ID of the newly created dare
   */
  async addDare(content, createdBy) {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Dare content cannot be empty');
    }
    if (content.length > MAX_DARE_CONTENT_LENGTH) {
      throw new Error(`Dare content is too long (maximum ${MAX_DARE_CONTENT_LENGTH} characters)`);
    }

    return await this.dareRepo.add(content.trim(), 'user', createdBy);
  }

  /**
   * Get all dares
   * @param {Object} filters - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.assignedTo] - Filter by assigned user
   * @returns {Promise<Array>} Array of all dares
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

    return await this.updateDare(id, { assignedTo: userId });
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
   * @returns {Promise<number>} Total number of dares
   */
  async getDareCount(filters = {}) {
    return await this.dareRepo.count(filters);
  }
}

module.exports = DareService;
