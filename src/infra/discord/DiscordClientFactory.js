const { Client, GatewayIntentBits, Partials } = require('discord.js');

/**
 * Factory function to create a Discord.js client with proper configuration
 * @param {Object} config - Bot configuration
 * @param {string} config.token - Discord bot token
 * @param {Object} logger - Logger instance
 * @returns {Client} Configured Discord client with event listeners
 * @example
 * const client = createDiscordClient(config, logger);
 * await client.login(config.token);
 */
function createDiscordClient(config, logger) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once('ready', () => {
    logger.info({ user: client.user.tag }, 'Discord client ready');
  });

  return client;
}

module.exports = { createDiscordClient };
