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

const AddQuoteHandler = require('../app/handlers/quotes/AddQuoteHandler');
const QuoteHandler = require('../app/handlers/quotes/QuoteHandler');
const RandomQuoteHandler = require('../app/handlers/quotes/RandomQuoteHandler');
const ListQuotesHandler = require('../app/handlers/quotes/ListQuotesHandler');
const SearchQuotesHandler = require('../app/handlers/quotes/SearchQuotesHandler');

const CreateDareHandler = require('../app/handlers/dares/CreateDareHandler');
const ListDaresHandler = require('../app/handlers/dares/ListDaresHandler');
const GetDareHandler = require('../app/handlers/dares/GetDareHandler');
const GiveDareHandler = require('../app/handlers/dares/GiveDareHandler');
const UpdateDareHandler = require('../app/handlers/dares/UpdateDareHandler');
const DeleteDareHandler = require('../app/handlers/dares/DeleteDareHandler');
const CompleteDareHandler = require('../app/handlers/dares/CompleteDareHandler');

const QuoteService = require('../core/services/QuoteService');
const DareService = require('../core/services/DareService');

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
    },
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
        discord: !!container.discordClient?.user,
      };
    },
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

  // Initialize quote service
  const quoteService = new QuoteService(container.repositories.quoteRepo);

  // Initialize dare service
  const dareService = new DareService(container.repositories.dareRepo, container.logger);

  // CORE
  registry.register('ping', new PingHandler(), {
    category: 'core',
    group: 'core',
    description: 'Check if the bot is alive.',
    usage: '/core ping',
    examples: ['/core ping'],
    options: [],
    cooldown: { seconds: 0 },
  });

  registry.register('info', new InfoHandler(statusProvider), {
    category: 'core',
    group: 'core',
    description: 'Show system status.',
    usage: '/core info',
    examples: ['/core info'],
    options: [],
    cooldown: { seconds: 0 },
  });

  registry.register('stats', new StatsHandler(), {
    category: 'core',
    group: 'core',
    description: 'Show CPU, memory, and load statistics.',
    usage: '/core stats',
    examples: ['/core stats'],
    options: [],
    cooldown: { seconds: 5 },
  });

  registry.register('uptime', new UptimeHandler(), {
    category: 'core',
    group: 'core',
    description: 'Show how long the bot has been running.',
    usage: '/core uptime',
    examples: ['/core uptime'],
    options: [],
    cooldown: { seconds: 0 },
  });

  registry.register('help', new HelpHandler(helpService), {
    category: 'core',
    group: 'core',
    description: 'Show help for commands or categories.',
    usage: '/core help [category] [command] [page]',
    examples: ['/core help', '/core help operations', '/core help deploy'],
    options: [
      { name: 'category', type: 'string', description: 'Command category', required: false },
      {
        name: 'command',
        type: 'string',
        description: 'Command name',
        required: false,
        autocomplete: true,
      },
      { name: 'page', type: 'integer', description: 'Page number', required: false },
    ],
    cooldown: { seconds: 0 },
  });

  // MESSAGING
  registry.register('say', new SayHandler(messageService), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a message to the current channel.',
    usage: '/msg say text:<message>',
    examples: ['/msg say text:Hello world'],
    options: [{ name: 'text', type: 'string', description: 'Message text', required: true }],
    cooldown: { seconds: 3 },
  });

  registry.register('broadcast', new BroadcastHandler(container.discordClient), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a message to all text channels.',
    usage: '/msg broadcast text:<message>',
    examples: ['/msg broadcast text:Maintenance in 5 minutes'],
    options: [{ name: 'text', type: 'string', description: 'Message text', required: true }],
    cooldown: { seconds: 10 },
  });

  registry.register('notify', new NotifyHandler(container.discordClient), {
    category: 'messaging',
    group: 'msg',
    description: 'Send a direct message to a user.',
    usage: '/msg notify user:<user> text:<message>',
    examples: ['/msg notify user:@User text:Hello!'],
    options: [
      { name: 'user', type: 'user', description: 'User to notify', required: true },
      { name: 'text', type: 'string', description: 'Message text', required: true },
    ],
    cooldown: { seconds: 5 },
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
          { name: 'production', value: 'production' },
        ],
      },
    ],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 10 },
  });

  registry.register('heavywork', new HeavyWorkHandler(container.jobQueue), {
    category: 'operations',
    group: 'ops',
    description: 'Queue a long-running background job.',
    usage: '/ops heavywork args:<args>',
    examples: ['/ops heavywork args:"process 5000 items"'],
    options: [
      { name: 'args', type: 'string', description: 'Arguments for heavy work', required: true },
    ],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 30 },
  });

  registry.register('jobstatus', new JobStatusHandler(container.jobQueue), {
    category: 'operations',
    group: 'ops',
    description: 'Check the status of a background job.',
    usage: '/ops jobstatus id:<jobId>',
    examples: ['/ops jobstatus id:12345'],
    options: [{ name: 'id', type: 'string', description: 'Job ID', required: true }],
    permissions: { discordPermissions: ['ManageGuild'] },
    cooldown: { seconds: 3 },
  });

  // ADMIN
  registry.register('allow', new AllowHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a command to be executed.',
    usage: '/admin allow command:<name>',
    examples: ['/admin allow command:deploy'],
    options: [{ name: 'command', type: 'string', description: 'Command to allow', required: true }],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('deny', new DenyHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Remove a command from the allowed list.',
    usage: '/admin deny command:<name>',
    examples: ['/admin deny command:deploy'],
    options: [{ name: 'command', type: 'string', description: 'Command to deny', required: true }],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('allowrole', new AllowRoleHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a role to use a command.',
    usage: '/admin allowrole command:<name> role:<role>',
    examples: ['/admin allowrole command:deploy role:@DevOps'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'role', type: 'role', description: 'Role to allow', required: true },
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('allowuser', new AllowUserHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a user to use a command.',
    usage: '/admin allowuser command:<name> user:<user>',
    examples: ['/admin allowuser command:deploy user:@Olav'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'user', type: 'user', description: 'User to allow', required: true },
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('allowchannel', new AllowChannelHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Allow a channel to use a command.',
    usage: '/admin allowchannel command:<name> channel:<channel>',
    examples: ['/admin allowchannel command:deploy channel:#ops'],
    options: [
      { name: 'command', type: 'string', description: 'Command name', required: true },
      { name: 'channel', type: 'channel', description: 'Channel to allow', required: true },
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('allowed', new AllowedHandler(container.repositories, registry), {
    category: 'admin',
    group: 'admin',
    description: 'List allowed commands.',
    usage: '/admin allowed [category] [page]',
    examples: ['/admin allowed', '/admin allowed category:operations page:2'],
    options: [
      { name: 'category', type: 'string', description: 'Filter by category', required: false },
      { name: 'page', type: 'integer', description: 'Page number', required: false },
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  registry.register('audit', new AuditHandler(container.repositories), {
    category: 'admin',
    group: 'admin',
    description: 'Show recent audit log entries.',
    usage: '/admin audit [limit]',
    examples: ['/admin audit', '/admin audit limit:50'],
    options: [
      { name: 'limit', type: 'integer', description: 'Number of entries', required: false },
    ],
    permissions: { discordPermissions: ['Administrator'] },
    cooldown: { seconds: 0 },
  });

  // QUOTES
  registry.register('addquote', new AddQuoteHandler(quoteService), {
    category: 'quotes',
    group: 'quote',
    description: 'Add a new quote to the database.',
    usage: '/quote addquote text:<quote> [author:<name>]',
    examples: [
      '/quote addquote text:"To be or not to be" author:"Shakespeare"',
      '/quote addquote text:"Hello World"',
    ],
    options: [
      { name: 'text', type: 'string', description: 'Quote text', required: true },
      { name: 'author', type: 'string', description: 'Quote author', required: false },
    ],
    cooldown: { seconds: 5 },
  });

  registry.register('quote', new QuoteHandler(quoteService), {
    category: 'quotes',
    group: 'quote',
    description: 'Get a quote by its ID.',
    usage: '/quote quote id:<number>',
    examples: ['/quote quote id:1', '/quote quote id:42'],
    options: [{ name: 'id', type: 'integer', description: 'Quote ID', required: true }],
    cooldown: { seconds: 2 },
  });

  registry.register('randomquote', new RandomQuoteHandler(quoteService), {
    category: 'quotes',
    group: 'quote',
    description: 'Get a random quote from the database.',
    usage: '/quote randomquote',
    examples: ['/quote randomquote'],
    options: [],
    cooldown: { seconds: 3 },
  });

  registry.register('listquotes', new ListQuotesHandler(quoteService), {
    category: 'quotes',
    group: 'quote',
    description: 'List all quotes in the database.',
    usage: '/quote listquotes',
    examples: ['/quote listquotes'],
    options: [],
    cooldown: { seconds: 5 },
  });

  registry.register('searchquotes', new SearchQuotesHandler(quoteService), {
    category: 'quotes',
    group: 'quote',
    description: 'Search quotes by text or author.',
    usage: '/quote searchquotes query:<search>',
    examples: ['/quote searchquotes query:"wisdom"', '/quote searchquotes query:"Einstein"'],
    options: [{ name: 'query', type: 'string', description: 'Search query', required: true }],
    cooldown: { seconds: 3 },
  });

  // DARES
  registry.register('createdare', new CreateDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Generate a new AI dare from Perchance.org and store it.',
    usage: '/dare createdare',
    examples: ['/dare createdare'],
    options: [],
    cooldown: { seconds: 5 },
  });

  registry.register('listdares', new ListDaresHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'List all dares in the database.',
    usage: '/dare listdares [status:<active|completed|archived>]',
    examples: ['/dare listdares', '/dare listdares status:active'],
    options: [
      {
        name: 'status',
        type: 'string',
        description: 'Filter by status',
        required: false,
        choices: [
          { name: 'active', value: 'active' },
          { name: 'completed', value: 'completed' },
          { name: 'archived', value: 'archived' },
        ],
      },
    ],
    cooldown: { seconds: 5 },
  });

  registry.register('getdare', new GetDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Get a specific dare by ID.',
    usage: '/dare getdare id:<number>',
    examples: ['/dare getdare id:1', '/dare getdare id:42'],
    options: [{ name: 'id', type: 'integer', description: 'Dare ID', required: true }],
    cooldown: { seconds: 2 },
  });

  registry.register('givedare', new GiveDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Give a dare to a specific Discord user.',
    usage: '/dare givedare user:<user> [random:<true|false>] [dare_id:<id>]',
    examples: [
      '/dare givedare user:@User random:true',
      '/dare givedare user:@User dare_id:5',
      '/dare givedare user:@User',
    ],
    options: [
      { name: 'user', type: 'user', description: 'User to give dare to', required: true },
      {
        name: 'random',
        type: 'boolean',
        description: 'Give a random dare',
        required: false,
      },
      {
        name: 'dare_id',
        type: 'integer',
        description: 'Specific dare ID to give',
        required: false,
      },
    ],
    cooldown: { seconds: 3 },
  });

  registry.register('updatedare', new UpdateDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Update an existing dare.',
    usage: '/dare updatedare id:<number> [content:<text>] [status:<active|completed|archived>]',
    examples: [
      '/dare updatedare id:1 content:"New dare text"',
      '/dare updatedare id:1 status:archived',
    ],
    options: [
      { name: 'id', type: 'integer', description: 'Dare ID', required: true },
      { name: 'content', type: 'string', description: 'New dare content', required: false },
      {
        name: 'status',
        type: 'string',
        description: 'New status',
        required: false,
        choices: [
          { name: 'active', value: 'active' },
          { name: 'completed', value: 'completed' },
          { name: 'archived', value: 'archived' },
        ],
      },
    ],
    cooldown: { seconds: 3 },
  });

  registry.register('deletedare', new DeleteDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Delete a dare from the database.',
    usage: '/dare deletedare id:<number>',
    examples: ['/dare deletedare id:1'],
    options: [{ name: 'id', type: 'integer', description: 'Dare ID', required: true }],
    cooldown: { seconds: 3 },
  });

  registry.register('completedare', new CompleteDareHandler(dareService), {
    category: 'dares',
    group: 'dare',
    description: 'Mark a dare as completed.',
    usage: '/dare completedare id:<number> [notes:<text>]',
    examples: [
      '/dare completedare id:1',
      '/dare completedare id:1 notes:"It was challenging!"',
    ],
    options: [
      { name: 'id', type: 'integer', description: 'Dare ID', required: true },
      {
        name: 'notes',
        type: 'string',
        description: 'Completion notes (optional)',
        required: false,
      },
    ],
    cooldown: { seconds: 3 },
  });

  const pipeline = new MiddlewarePipeline([
    new LoggingMiddleware(container.logger, container.metrics),
    new PermissionMiddleware(container.services.permissionService),
    new RateLimitMiddleware(container.services.rateLimitService),
    new AuditMiddleware(container.repositories.auditRepo),
  ]);

  const bus = new CommandBus(registry, pipeline);
  container.commandBus = bus;

  return { bus, registry, messageService };
}

module.exports = { bootstrap };
