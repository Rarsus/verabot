require('dotenv').config();

const { createContainer } = require('./infra/di/container');
const { createDiscordClient } = require('./infra/discord/DiscordClientFactory');
const { createWsClient } = require('./infra/ws/WsClientFactory');
const WsAdapter = require('./infra/ws/WsAdapter');
const { bootstrap } = require('./infra/bootstrap');
const { createHealthMetricsServer } = require('./interfaces/http/HealthMetricsServer');
const { createBullBoardServer } = require('./interfaces/http/BullBoardServer');
const SlashCommandRegistrar = require('./infra/discord/SlashCommandRegistrar');
const SlashCommandAdapter = require('./infra/discord/SlashCommandAdapter');

async function main() {
  const container = createContainer();

  const discordClient = createDiscordClient(container.config, container.logger);
  container.discordClient = discordClient;

  const wsClient = createWsClient(container.config, container.logger);
  container.wsClient = wsClient;

  await container.scheduler.registerCronJobs();

  const { bus, registry } = bootstrap(container);

  const registrar = new SlashCommandRegistrar(container.config, registry, container.logger);
  await registrar.registerCommands();

  const slashAdapter = new SlashCommandAdapter(
    discordClient,
    bus,
    registry,
    container.logger,
    container.services.helpService,
  );
  slashAdapter.registerListeners();

  const wsAdapter = new WsAdapter(wsClient, bus, container.logger);
  wsAdapter.registerListeners();

  const httpServer = createHealthMetricsServer(container);
  container.httpServer = httpServer;

  createBullBoardServer(container);

  await discordClient.login(container.config.DISCORD_TOKEN);

  const shutdown = async () => {
    container.logger.info('Shutting down gracefully...');
    try {
      await container.db.close();
      if (httpServer) httpServer.close();
      process.exit(0);
    } catch (err) {
      container.logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error in main', err);
  process.exit(1);
});
