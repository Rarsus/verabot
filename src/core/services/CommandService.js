/**
 * Service for managing command allowlist
 * @class CommandService
 * @example
 * const service = new CommandService(commandRepo);
 * const allowed = await service.isAllowed('ping');
 */
class CommandService {
  /**
   * Create a new CommandService instance
   * @param {Object} commandRepo - Command repository for data access
   */
  constructor(commandRepo) {
    /** @type {Object} */
    this.commandRepo = commandRepo;
  }

  /**
   * Check if a command is allowed
   * @param {string} commandName - The command name to check
   * @returns {Promise<boolean>} Whether the command is allowed
   */
  async isAllowed(commandName) {
    return this.commandRepo.isAllowed(commandName);
  }

  /**
   * List all allowed commands
   * @returns {Promise<string[]>} Array of allowed command names
   */
  async listAllowed() {
    return this.commandRepo.listAllowed();
  }

  /**
   * Add a command to the allowlist
   * @param {string} commandName - The command to allow
   * @param {string} addedBy - User ID of who added the command
   * @returns {Promise<Object>} The added command record
   */
  async addAllowed(commandName, addedBy) {
    return this.commandRepo.addAllowed(commandName, addedBy);
  }

  /**
   * Remove a command from the allowlist
   * @param {string} commandName - The command to disallow
   * @returns {Promise<Object>} The removed command record
   */
  async removeAllowed(commandName) {
    return this.commandRepo.removeAllowed(commandName);
  }
}

module.exports = CommandService;

