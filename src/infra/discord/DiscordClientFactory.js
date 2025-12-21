const { Client, GatewayIntentBits, Partials } = require('discord.js');

function createDiscordClient(config, logger) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });

  client.once('ready', () => {
    logger.info({ user: client.user.tag }, 'Discord client ready');
  });

  return client;
}

module.exports = { createDiscordClient };
