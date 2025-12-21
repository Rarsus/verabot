/**
 * Base Command class representing a command that can be executed
 * @typedef {Object} CommandOptions
 * @property {string} name - The name of the command
 * @property {string} source - The source of the command (discord, api, cli, webhook)
 * @property {string} [userId] - The ID of the user executing the command
 * @property {string} [channelId] - The ID of the channel where command was executed
 * @property {string[]} [args] - Command arguments
 * @property {Object} [metadata={}] - Additional command metadata
 */

/**
 * Represents a command with execution context
 * @class Command
 * @example
 * const command = new Command({
 *   name: 'ping',
 *   source: 'discord',
 *   userId: '123456',
 *   channelId: '789012'
 * });
 */
class Command {
  /**
   * Create a new Command instance
   * @param {CommandOptions} options - Command configuration
   */
  constructor({ name, source, userId, channelId, args, metadata = {} }) {
    this.name = name;
    this.source = source;
    this.userId = userId || null;
    this.channelId = channelId || null;
    this.args = args || [];
    this.metadata = metadata;
  }
}

module.exports = Command;

