const RateLimitError = require('../errors/RateLimitError');

/**
 * Service for enforcing rate limits on command execution
 * @class RateLimitService
 * @example
 * const service = new RateLimitService(repo, 3000, { admin: 0 });
 * await service.tryConsume(command, 'core');
 */
class RateLimitService {
  /**
   * Create a new RateLimitService instance
   * @param {Object} rateLimitRepo - Rate limit repository for data access
   * @param {number} [defaultCooldownMs=3000] - Default cooldown in milliseconds
   * @param {Object} [categoryCooldowns={}] - Category-specific cooldowns
   * @param {number} [categoryCooldowns.core=0] - Core command cooldown
   * @param {number} [categoryCooldowns.messaging=3000] - Messaging command cooldown
   * @param {number} [categoryCooldowns.operations=10000] - Operations command cooldown
   * @param {number} [categoryCooldowns.admin=0] - Admin command cooldown
   */
  constructor(rateLimitRepo, defaultCooldownMs = 3000, categoryCooldowns = {}) {
    /** @type {Object} */
    this.rateLimitRepo = rateLimitRepo;
    /** @type {number} */
    this.defaultCooldownMs = defaultCooldownMs;
    /** @type {Object<string, number>} */
    this.categoryCooldowns = {
      core: 0,
      messaging: 3000,
      operations: 10000,
      admin: 0,
      ...categoryCooldowns,
    };
  }

  /**
   * Check if a command can be executed (applies rate limiting)
   * @param {Command} command - The command to check
   * @param {string} [category='core'] - The command category
   * @returns {Promise<boolean>} True if command can execute
   * @throws {RateLimitError} If rate limit is exceeded
   */
  async tryConsume(command, category = 'core') {
    const cooldown =
      this.categoryCooldowns[category] !== undefined
        ? this.categoryCooldowns[category]
        : this.defaultCooldownMs;

    if (cooldown === 0) return true;

    const now = Date.now();
    const last = await this.rateLimitRepo.getLastUsed(command.name);
    if (!last) {
      await this.rateLimitRepo.setLastUsed(command.name, now);
      return true;
    }
    if (now - last >= cooldown) {
      await this.rateLimitRepo.setLastUsed(command.name, now);
      return true;
    }
    throw new RateLimitError();
  }
}

module.exports = RateLimitService;
