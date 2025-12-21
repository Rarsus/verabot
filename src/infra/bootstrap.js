const CommandRegistry = require('../core/commands/CommandRegistry');
const MiddlewarePipeline = require('../app/bus/MiddlewarePipeline');
const CommandBus = require('../app/bus/CommandBus');

const LoggingMiddleware = require('../app/middleware/LoggingMiddleware');
const PermissionMiddleware = require('../app/middleware/PermissionMiddleware');
const RateLimitMiddleware = require('../app/middleware/RateLimitMiddleware');
const AuditMiddleware = require('../app/middleware/AuditMiddleware');

const PingHandler = require('../app/handlers/core/PingHandler');
const InfoHandler = require('../app/handlers/core/InfoHandler');
const StatsHandler = require('../app/handlers/core/StatsHandler');
const UptimeHandler = require('../app/handlers/core/UptimeHandler');
const HelpHandler = require('../app/handlers/core/HelpHandler');

const SayHandler = require('../app/handlers/messaging/SayHandler');
const BroadcastHandler = require('../app/handlers/messaging/BroadcastHandler');
const NotifyHandler = require('../app/handlers/messaging/NotifyHandler');

const DeployHandler = require('../app/handlers/operations/DeployHandler');
const HeavyWorkHandler = require('../app/handlers/operations/HeavyWorkHandler');
const JobStatusHandler = require('../app/handlers/operations/JobStatusHandler');

const AllowHandler = require('../app/handlers/admin/AllowHandler');
const DenyHandler = require('../app/handlers/admin/DenyHandler');
const AllowRoleHandler = require('../app/handlers/admin/AllowRoleHandler');
const AllowUserHandler = require('../app/handlers/admin/AllowUserHandler');
const AllowChannelHandler = require('../app/handlers/admin/AllowChannelHandler');
const AllowedHandler = require('../app/handlers/admin/AllowedHandler');
const AuditHandler = require('../app/handlers/admin/AuditHandler');

/**
 * Create message broadcast service for Discord channel messaging
 * @param {Discord.Client} discordClient - Discord.js client instance
 * @returns {Object} Message service with broadcast method
 * @private
 */
function createMessageService(discordClient) {
  return {
    async broadcast(command, text) {
      if (command.source === 'discord') {
        const channel = await discordClient.channels.fetch(command.channelId);
        if (channel && channel.isTextBased()) await channel.send(text);
      }
    }
  };
}

/**
 * Create status provider for system health checks
 * @param {Object} container - Dependency injection container
 * @returns {Object} Status provider with getStatus method
 * @private
 */
function createStatusProvider(container) {
  return {
    async getStatus() {
      return {
        env: container.config.NODE_ENV,
        db: container.db.isConnected(),
        ws: container.wsClient?.isConnected() || false,
        discord: !!container.discordClient?.user
      };
    }
  };
}

/**
 * Bootstrap application by registering all command handlers and middleware
 * Initializes command registry with all core, messaging, operations, and admin commands
 * Sets up middleware pipeline with logging, permission, rate limit, and audit middleware
 * @param {Object} container - Dependency injection container with config, services, db, etc.
 * @returns {Object} Bootstrap result with registry, pipeline, bus, and services
 * @returns {CommandRegistry} returns.registry - Command registry with all handlers registered
 * @returns {MiddlewarePipeline} returns.pipeline - Middleware pipeline with all middleware
 * @returns {CommandBus} returns.bus - Command bus for executing commands
 * @returns {Object} returns.messageService - Message broadcasting service
 * @returns {Object} returns.statusProvider - System status provider for health checks
 * @example
 * const result = bootstrap(container);
 * const { registry, pipeline, bus } = result;
 * const command = new Command({ name: 'ping', source: 'discord', args: [] });
 * const result = await bus.execute(command);
 */
function bootstrap(container) {
  const registry = new CommandRegistry();
  const messageService = createMessageService(container.discordClient);
  const statusProvider = createStatusProvider(container);
  const helpService = container.services.helpService;
  helpService.registry = registry;

  // CORE
  registry.register('ping', new PingHandler(), {
    category: 'core',
    group: 'core',
    description: 'Check if the bot is alive.',
    usage: '/core ping',
    examples: ['/core ping'],
    options: [],
    cooldown: { seconds: 0 }
  });

  registry.register('info', new InfoHandler(statusProvider), {
    category: 'core',
    group: 'core',
    description: 'Show system status.',
    usage: '/core info',
    examples: ['/core info'],
    options: [],
    cooldown: { seconds: 0 }
  });

  registry.register('stats', new StatsHandler(), {
    category: 'core',
    group: 'core',
    description: 'Show CPU, memory, and load statistics.',
    usage: '/core stats',
    examples: ['/core stats'],
    options: [],
    cooldown: { seconds: 5 }
  });

  registry.register('uptime', new UptimeHandler(), {
    category: 'core',
    group: 'core',
    description: 'Show how long the bot has been running.',
    usage: '/core uptime',
    examples: ['/core uptime'],
    options: [],
    cooldown: { seconds: 0 }
  });

  registry.register('help', new HelpHandler(helpService), {
    category: 'core',
    group: 'core',
    description: 'Show help for commands or categories.',
    usage: '/core help [category] [command] [page]',
    examples: ['/core help', '/core help operations', '/core help deploy'],
    options: [
      { name: 'category', type: 'string', description: 'Command category', required: false },
      { name: 'command', type: 'string', description: 'Command name', required: false, autocomplete: true },
      { name: 'page', type: 'integer', description: 'Page number', required: false }
    ],
    cooldown: { seconds: 0 }
  });

  // MESSAGING
  registry.register('say', new SayHandler(messageService), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a message to the current channel.',
    usage: '/msg say text:<message>',
    examples: ['/msg say text:Hello world'],
    options: [
      { name: 'text', type: 'string', description: 'Message text', required: true }
    ],
    cooldown: { seconds: 3 }
  });

  registry.register('broadcast', new BroadcastHandler(container.discordClient), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a message to all text channels.',
    usage: '/msg broadcast text:<message>',
    examples: ['/msg broadcast text:Maintenance in 5 minutes'],
    options: [
      { name: 'text', type: 'string', description: 'Message text', required: true }
    ],
    cooldown: { seconds: 10 }
  });

  registry.register('notify', new NotifyHandler(container.discordClient), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a direct message to a user.',
    usage: '/msg notify user:<user> text:<message>',
    examples: ['/msg notify user:@User text:Hello!'],
    options: [
      { name: 'user', type: 'user', description: 'User to notify', required: true },
      { name: 'text', type: 'string', description: 'Message text', required: true }
    ],
    cooldown: { seconds: 5 }
  });

  // OPERATIONS
  registry.register('deploy', new DeployHandler(container.logger), {
    category: 'operations',
    group: 'ops',
    description: 'Trigger a deployment workflow.',
    usage: '/ops deploy target:<env>',
    examples: ['/ops deploy target:staging', '/ops deploy target:production'],
    options: [
      {
        name: 'target',
        type: 'string',
        description: 'Deployment target',
        required: true,
        autocomplete: true,
        choices: [
          { name: 'staging', value: 'staging' },
          { name: 'production', value: 'production' }
        ]
      }
    ],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 10 }
  });

  registry.register('heavywork', new HeavyWorkHandler(container.jobQueue), {
    category: 'operations',
    group: 'ops',
    description: 'Queue a long-running background job.',
    usage: '/ops heavywork args:<args>',
    examples: ['/ops heavywork args:"process 5000 items"'],
    options: [
      { name: 'args', type: 'string', description: 'Arguments for heavy work', required: true }
    ],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 30 }
  });

  registry.register('jobstatus', new JobStatusHandler(container.jobQueue), {
    category: 'operations',
    group: 'ops',
    description: 'Check the status of a background job.',
    usage: '/ops jobstatus id:<jobId>',
    examples: ['/ops jobstatus id:12345'],
    options: [
      { name: 'id', type: 'string', description: 'Job ID', required: true }
    ],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 3 }
  });

  // ADMIN
  registry.register('allow', new AllowHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a command to be executed.',
    usage: '/admin allow command:<name>',
    examples: ['/admin allow command:deploy'],
    options: [
      { name: 'command', type: 'string', description: 'Command to allow', required: true }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('deny', new DenyHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Remove a command from the allowed list.',
    usage: '/admin deny command:<name>',
    examples: ['/admin deny command:deploy'],
    options: [
      { name: 'command', type: 'string', description: 'Command to deny', required: true }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('allowrole', new AllowRoleHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a role to use a command.',
    usage: '/admin allowrole command:<name> role:<role>',
    examples: ['/admin allowrole command:deploy role:@DevOps'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'role', type: 'role', description: 'Role to allow', required: true }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('allowuser', new AllowUserHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a user to use a command.',
    usage: '/admin allowuser command:<name> user:<user>',
    examples: ['/admin allowuser command:deploy user:@Olav'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'user', type: 'user', description: 'User to allow', required: true }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('allowchannel', new AllowChannelHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a channel to use a command.',
    usage: '/admin allowchannel command:<name> channel:<channel>',
    examples: ['/admin allowchannel command:deploy channel:#ops'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'channel', type: 'channel', description: 'Channel to allow', required: true }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('allowed', new AllowedHandler(container.repositories, registry), {
    category: 'admin',
    group: 'admin',
    description: 'List allowed commands.',
    usage: '/admin allowed [category] [page]',
    examples: ['/admin allowed', '/admin allowed category:operations page:2'],
    options: [
      { name: 'category', type: 'string', description: 'Filter by category', required: false },
      { name: 'page', type: 'integer', description: 'Page number', required: false }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  registry.register('audit', new AuditHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Show recent audit log entries.',
    usage: '/admin audit [limit]',
    examples: ['/admin audit', '/admin audit limit:50'],
    options: [
      { name: 'limit', type: 'integer', description: 'Number of entries', required: false }
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 }
  });

  const pipeline = new MiddlewarePipeline([
    new LoggingMiddleware(container.logger, container.metrics),
    new PermissionMiddleware(container.services.permissionService),
    new RateLimitMiddleware(container.services.rateLimitService),
    new AuditMiddleware(container.repositories.auditRepo)
  ]);

  const bus = new CommandBus(registry, pipeline);
  container.commandBus = bus;

  return { bus, registry, messageService };
}

module.exports = { bootstrap };
