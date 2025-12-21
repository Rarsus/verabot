const RateLimitError = require('../errors/RateLimitError');

class RateLimitService {
  constructor(rateLimitRepo, defaultCooldownMs = 3000, categoryCooldowns = {}) {
    this.rateLimitRepo = rateLimitRepo;
    this.defaultCooldownMs = defaultCooldownMs;
    this.categoryCooldowns = {
      core: 0,
      messaging: 3000,
      operations: 10000,
      admin: 0,
      ...categoryCooldowns
    };
  }

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
