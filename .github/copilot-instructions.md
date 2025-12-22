# Copilot Instructions for VeraBot

VeraBot is a production-grade Discord bot with enterprise architecture emphasizing separation of concerns, testability, and observability. It uses layered architecture with Command Bus, middleware pipeline, dependency injection, and comprehensive infrastructure.

## Project Overview

**Key Features:**

- Discord slash commands and prefix commands
- Advanced permission system (roles, channels, users)
- Command allowance list for feature gating
- Background job queue (BullMQ + Redis)
- WebSocket support for alternative interfaces
- Comprehensive monitoring (Prometheus metrics, health checks)
- Structured logging (Pino)
- Rate limiting with Redis backend
- Audit trail for all permission changes

## Technology Stack

**Core:**

- **Runtime:** Node.js 18+
- **Language:** JavaScript (ES2021)
- **Discord API:** Discord.js v14.16.0
- **Database:** SQLite (better-sqlite3)

**Infrastructure:**

- **Job Queue:** BullMQ v5.9.0 + Redis
- **Logging:** Pino v10.0.0
- **Metrics:** Prometheus (prom-client)
- **WebSocket:** ws v8.18.0
- **Validation:** Zod v4.0.0
- **HTTP:** Express v5.0.0

**Development:**

- **Testing:** Jest v30.0.0
- **Linting:** ESLint v9.39.2
- **Code Quality:** Pre-commit hooks (Husky)

## Architecture Overview

**Layered Architecture:**

```
┌─────────────────────────────────────────┐
│   Interfaces (Discord, HTTP, WebSocket) │
├─────────────────────────────────────────┤
│   Command Bus & Middleware Pipeline     │
│   (Routing, validation, authorization)  │
├─────────────────────────────────────────┤
│   Application Handlers (Business logic) │
├─────────────────────────────────────────┤
│   Services & Repositories (Data access) │
├─────────────────────────────────────────┤
│   Infrastructure (DB, Queue, Cache)     │
└─────────────────────────────────────────┘
```

### Critical Patterns

**1. Command Bus Pattern**
All commands execute through a centralized bus that routes to handlers:

```javascript
// Command object encapsulates execution context
const command = new Command({
  name: "ping",
  source: "discord",
  userId: "123456",
  channelId: "789012",
});

// Bus executes through middleware pipeline then handler
const result = await commandBus.execute(command);
```

**2. Middleware Pipeline**
Middlewares process commands sequentially before reaching handlers:

- `LoggingMiddleware` - Request/response logging
- `PermissionMiddleware` - Access control validation
- `AuditMiddleware` - Record permission changes
- `RateLimitMiddleware` - Enforce command limits (Redis-backed)

**3. Dependency Injection Container**
All services initialized in `src/infra/di/container.js`:

```javascript
const container = createContainer();
const { config, logger, services, db, repositories } = container;
```

**4. Handler Pattern**
Each command has a dedicated handler extending business logic:

```javascript
class MyHandler {
  async handle(command) {
    // Business logic
    return CommandResult.ok(data);
  }
}
```

**5. Repository Pattern**
Data access abstracted in repositories (CommandRepository, PermissionRepository, RateLimitRepository).

## Project Structure

```
src/
├── index.js                    # Bot entry point (Discord client setup)
├── bootstrap.js                # Container initialization & event listeners
├── core/
│   ├── commands/
│   │   ├── Command.js          # Command object (name, source, userId, etc.)
│   │   └── CommandResult.js    # Result wrapper (ok/error/unauthorized)
│   ├── services/               # Business logic
│   │   ├── CommandService.js
│   │   ├── PermissionService.js
│   │   ├── RateLimitService.js
│   │   └── HelpService.js
│   └── errors/                 # Error classes (CommandError, etc.)
├── app/
│   ├── bus/
│   │   ├── CommandBus.js       # Centralized command router
│   │   └── MiddlewarePipeline.js # Sequential middleware execution
│   ├── handlers/               # Command handlers organized by category
│   │   ├── core/               # Core commands (ping, help, stats)
│   │   ├── messaging/          # Message operations (say, notify)
│   │   ├── operations/         # System operations (deploy, jobs)
│   │   ├── admin/              # Admin-only commands
│   │   └── quotes/             # Quote management
│   └── middleware/             # Pipeline middleware
│       ├── LoggingMiddleware.js
│       ├── PermissionMiddleware.js
│       ├── AuditMiddleware.js
│       └── RateLimitMiddleware.js
├── infra/
│   ├── bootstrap.js            # Initialize all infrastructure
│   ├── config/                 # Configuration management
│   │   └── Config.js
│   ├── db/
│   │   ├── SqliteDb.js         # SQLite connection
│   │   ├── Repositories.js     # Data access objects
│   │   └── RedisFactory.js     # Redis connection
│   ├── discord/                # Discord.js integration
│   │   ├── DiscordClientFactory.js
│   │   ├── SlashCommandAdapter.js
│   │   └── SlashCommandRegistrar.js
│   ├── queue/                  # Background job queue
│   │   ├── JobQueueService.js
│   │   └── Scheduler.js
│   ├── logging/                # Structured logging
│   │   └── Logger.js
│   ├── metrics/                # Prometheus metrics
│   │   └── Metrics.js
│   ├── ws/                     # WebSocket support
│   │   └── WsAdapter.js
│   ├── http/                   # HTTP servers
│   │   ├── HealthMetricsServer.js
│   │   └── BullBoardServer.js
│   ├── health/                 # Health checks
│   │   └── HealthCheck.js
│   └── di/
│       └── container.js        # Dependency injection setup
├── interfaces/                 # Adapter implementations
└── config/                     # Environment & defaults

tests/
├── unit/                       # Unit tests for handlers, services
└── integration/                # Integration tests for flows
```

## Development Workflow

### Understanding Command Flow

When a user runs `/ping`:

```
Discord Message
    ↓
SlashCommandAdapter.handle(interaction)
    ↓
Create Command object with context
    ↓
CommandBus.execute(command)
    ↓
MiddlewarePipeline [Logging → Permission → Audit → RateLimit]
    ↓
PingHandler.handle(command)
    ↓
CommandResult.ok({ message: 'pong' })
    ↓
Format response & send to Discord
```

### Creating a New Command Handler

1. **Create handler** in `src/app/handlers/{category}/MyHandler.js`:

```javascript
const CommandResult = require("../../../core/commands/CommandResult");

class MyHandler {
  constructor(services) {
    this.services = services; // DI-injected
  }

  async handle(command) {
    try {
      // Access service via this.services.commandService
      const result = await this.services.commandService.doSomething();
      return CommandResult.ok(result);
    } catch (err) {
      return CommandResult.error("Operation failed");
    }
  }
}

module.exports = MyHandler;
```

2. **Register in container** - Add to `src/infra/di/container.js`:

```javascript
const MyHandler = require("../../app/handlers/category/MyHandler");
// ...
const myHandler = new MyHandler(services);
registry.register("mycommand", myHandler);
```

3. **Register with Discord** - Handler auto-registers via adapter.

4. **Add tests** - Unit tests in `tests/unit/handlers/`.

### Common Tasks

**Add a new service:**

```javascript
// src/core/services/MyService.js
class MyService {
  constructor(repository) {
    this.repository = repository;
  }

  async doSomething() {
    // Business logic using repository
  }
}

module.exports = MyService;
```

**Add a repository:**

```javascript
// src/infra/db/Repositories.js - extend existing
const myRepository = {
  getAll: () => db.prepare("SELECT * FROM my_table").all(),
  insert: (data) => db.prepare("INSERT INTO my_table VALUES (?)").run(data),
};
```

**Add middleware:**

```javascript
// src/app/middleware/MyMiddleware.js
class MyMiddleware {
  async handle(context, next) {
    // Pre-processing
    const result = await next();
    // Post-processing
    return result;
  }
}
```

## Code Quality Standards

### ESLint Configuration

- Located in `src/interfaces/eslint.config.js`
- Enforces strict rules: no console, var declarations, unused variables
- **MUST pass before commit**

### Testing Strategy

```bash
npm test                        # Run all tests
npm run test:unit               # Unit tests only
npm run test:integration        # Integration tests only
npm run test:watch              # Watch mode for development
npm run test:coverage           # Coverage report
npm run lint                    # Check style
npm run lint:fix                # Auto-fix style issues
npm run format                  # Format code with Prettier
npm run format:check            # Check formatting
```

**Testing Requirements:**

- All new handlers need unit tests
- Integration tests for command flows
- Mock services using `jest-mock-extended`
- 80%+ coverage target

### Code Style

- **Variables:** camelCase
- **Classes:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case
- **Semicolons:** REQUIRED
- **No console.log:** Use logger.info/debug
- **Async/Await:** Required (no .then chains)

## Critical Development Patterns

### Error Handling

Commands return `CommandResult` with status:

```javascript
// Success
CommandResult.ok({ data });

// Error
CommandResult.error("User-friendly message");

// Unauthorized
CommandResult.unauthorized("Permission denied");
```

**Never throw in handlers** - catch and return CommandResult.

### Logging

Use injected logger (Pino):

```javascript
// In handler or service with logger injected
logger.info({ command: "ping" }, "Executing ping");
logger.error({ err, userId }, "Permission check failed");
logger.debug({ context }, "Processing command");
```

### Middleware Access

Middleware receives context object:

```javascript
async handle(context, next) {
  const { command } = context;
  // Access command: name, source, userId, channelId
  return next();
}
```

### Rate Limiting

Redis-backed rate limiting via middleware:

```javascript
// src/app/middleware/RateLimitMiddleware.js configures limits by command category
const rateLimits = {
  core: 0, // unlimited
  messaging: 3000, // 3 seconds
  operations: 10000, // 10 seconds
};
```

## Environment Configuration

Create `.env` from `.env.example`:

```env
# Discord
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id

# Database
DB_PATH=./data/bot.db

# Redis (optional, for queue/cache)
REDIS_URL=redis://localhost:6379

# Monitoring
HEALTH_PORT=3000
METRICS_PORT=3001

# Logging
LOG_LEVEL=info
```

## Infrastructure Components

### Job Queue (BullMQ)

For background work:

```javascript
const { jobQueue } = container;
await jobQueue.add("processReport", { userId });
```

### Health Checks

Endpoint at `:3000/health` returns system status.

### Metrics

Prometheus metrics at `:3001/metrics` - tracks commands, errors, latency.

### WebSocket Support

Alternative to HTTP for command execution - see `src/infra/ws/WsAdapter.js`.

## Performance Guidelines

- Command execution: Target < 200ms
- Database queries: Keep < 100ms
- Queue jobs: Async background work
- Defer Discord replies if processing > 3 seconds
- Use Redis for caching frequently accessed data

## Critical Files to Reference

- **Command flow:** [src/app/bus/CommandBus.js](src/app/bus/CommandBus.js)
- **Middleware pipeline:** [src/app/bus/MiddlewarePipeline.js](src/app/bus/MiddlewarePipeline.js)
- **DI setup:** [src/infra/di/container.js](src/infra/di/container.js)
- **Handler example:** [src/app/handlers/core/PingHandler.js](src/app/handlers/core/PingHandler.js)
- **Result type:** [src/core/commands/CommandResult.js](src/core/commands/CommandResult.js)

## Testing Examples

**Unit test handler:**

```javascript
describe("MyHandler", () => {
  let handler, serviceMock;

  beforeEach(() => {
    serviceMock = mock();
    handler = new MyHandler({ commandService: serviceMock });
  });

  it("should handle ping command", async () => {
    const result = await handler.handle({});
    expect(result.isOk).toBe(true);
  });
});
```

## Version Information

- **Current Version:** 1.0.0 (December 2024)
- **Node.js:** 18+ required
- **Architecture:** Layered with Command Bus
- **Database:** SQLite + Redis (optional)
- **Key Branch:** main (stable), develop (active)

## Troubleshooting

**Commands not executing?**

- Check command registration in `src/infra/di/container.js`
- Verify handler is properly instantiated
- Check middleware isn't blocking (permission issues)

**Tests failing?**

- Run `npm run test:coverage` to identify coverage gaps
- Check mocks match service interfaces
- Verify DI container setup in test fixtures

**Performance issues?**

- Use `/metrics` endpoint to find slow commands
- Check database query performance
- Profile with Node.js inspector

## Tips for Copilot

- Reference existing handlers as patterns
- Commands always return CommandResult
- Services injected via DI container
- Middleware processes in order defined
- Handlers are single-responsibility
- Avoid direct Discord API calls - use adapters
- Use structured logging, not console.log
