# 11. Development Guide

Get started as a VeraBot developer.

---

## Table of Contents

1. [Developer Setup](#developer-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Running Locally](#running-locally)
5. [Debugging](#debugging)
6. [Common Tasks](#common-tasks)

---

## Developer Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Redis (local or Docker)
- A text editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Rarsus/verabot.git
cd verabot

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Discord token
nano .env

# Run tests to verify setup
npm test
```

### VS Code Extensions (Recommended)

- **ESLint** - Code linting
- **Jest** - Test runner integration
- **Prettier** - Code formatter
- **Thunder Client** - API testing
- **GitLens** - Git integration

---

## Project Structure

### Source Code Layout

```
src/
├── index.js                    # Entry point
├── app/                        # Command handlers & middleware
│   ├── bus/
│   │   ├── CommandBus.js      # Central command dispatcher
│   │   └── MiddlewarePipeline.js
│   ├── handlers/              # Command implementations
│   │   ├── admin/
│   │   ├── core/
│   │   ├── messaging/
│   │   └── operations/
│   └── middleware/            # Cross-cutting concerns
│       ├── AuditMiddleware.js
│       ├── LoggingMiddleware.js
│       ├── PermissionMiddleware.js
│       └── RateLimitMiddleware.js
├── core/                       # Core abstractions
│   ├── commands/
│   │   ├── Command.js         # Command base class
│   │   ├── CommandRegistry.js # Command registry
│   │   └── CommandResult.js   # Result wrapper
│   ├── services/              # Core services
│   │   ├── CommandService.js
│   │   ├── PermissionService.js
│   │   ├── RateLimitService.js
│   │   └── HelpService.js
│   └── errors/                # Error types
│       ├── DomainError.js
│       ├── PermissionError.js
│       └── RateLimitError.js
├── infra/                      # Infrastructure
│   ├── bootstrap.js           # Application startup
│   ├── config/
│   │   ├── Config.js
│   │   └── RedisConfig.js
│   ├── db/
│   │   ├── SqliteDb.js
│   │   ├── Repositories.js
│   │   └── RedisFactory.js
│   ├── discord/               # Discord integration
│   │   ├── DiscordClientFactory.js
│   │   ├── SlashCommandAdapter.js
│   │   ├── SlashCommandRegistrar.js
│   │   └── EmbedFactory.js
│   ├── queue/                 # Job queue
│   │   ├── JobQueueService.js
│   │   └── Scheduler.js
│   ├── ws/                    # WebSocket
│   │   ├── WsAdapter.js
│   │   └── WsClientFactory.js
│   ├── http/                  # HTTP servers
│   │   ├── HealthMetricsServer.js
│   │   └── BullBoardServer.js
│   ├── health/
│   │   └── HealthCheck.js
│   ├── logging/
│   │   └── Logger.js
│   ├── metrics/
│   │   └── Metrics.js
│   ├── di/
│   │   └── container.js       # Dependency injection
│   └── queue/
│       └── JobQueueService.js
└── interfaces/
    └── http/
        └── endpoints/
```

### Test Structure

```
tests/
├── unit/                      # Isolated unit tests
│   ├── app/
│   ├── core/
│   └── infra/
└── integration/               # Integration tests
    └── CommandBus.test.js
```

---

## Development Workflow

### 1. Pick a Task

```
From: PHASE_1_COVERAGE_GAP.md
Or: GitHub Issues
Or: Your own ideas
```

### 2. Create Feature Branch

```bash
git checkout -b feature/add-new-command
# or
git checkout -b fix/bug-name
# or
git checkout -b test/add-handler-tests
```

### 3. Make Changes

Edit files in `src/`:

```bash
# Example: Add new handler
code src/app/handlers/core/MyNewHandler.js
```

### 4. Write Tests

Add tests in `tests/unit/`:

```bash
code tests/unit/app/handlers/core/MyNewHandler.test.js
```

### 5. Verify Changes

```bash
npm test                  # Run tests
npm run test:coverage     # Check coverage
npm run lint             # Check style
```

### 6. Commit

```bash
git add .
git commit -m "feat: add new handler for X"
```

### 7. Create Pull Request

Push and create PR on GitHub:

```bash
git push origin feature/add-new-command
```

---

## Running Locally

### Start Development Server

```bash
npm start
```

Expected output:

```
[INFO] Bot connected as @VeraBot#0001
[INFO] Listening to 45 commands
[INFO] Job queue initialized
[INFO] Health metrics server on port 3000
```

### With Debug Logging

```bash
LOG_LEVEL=debug npm start
```

Shows all operations:

```
[DEBUG] Processing command: ping
[DEBUG] Permission check: user has admin
[DEBUG] Command executed in 15ms
```

### Watch Mode (For Testing)

```bash
npm run test:watch
```

Auto-reruns tests on file changes.

### Monitor Job Queue

Open in browser:

```
http://localhost:3002/admin/queues
```

Shows:

- Queued jobs
- Running jobs
- Completed jobs
- Failed jobs

### Check Health

```bash
curl http://localhost:3000/health
```

Returns:

```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-12-21T10:00:00Z"
}
```

---

## Debugging

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

Shows detailed logs for all operations.

### VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Bot",
      "program": "${workspaceFolder}/src/index.js",
      "restart": true,
      "console": "integratedTerminal",
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  ]
}
```

Then press F5 to start debugging.

### Using Console Logs

```javascript
// Add temporary debug logs
console.log('Debug info:', variable);

// Later, run with LOG_LEVEL=debug to see them mixed with logs
```

### Inspect Variables

In VS Code debugger:

1. Set breakpoint (click line number)
2. Run debugger (F5)
3. Inspect variables in debug panel
4. Step through code (F10/F11)

---

## Common Tasks

### Add a New Command

See [Adding Commands](./14-ADDING-COMMANDS.md) for step-by-step guide.

Quick version:

```bash
# 1. Create handler
code src/app/handlers/core/MyCommandHandler.js

# 2. Implement handle() method
# 3. Export at bottom

# 4. Create tests
code tests/unit/app/handlers/core/MyCommandHandler.test.js

# 5. Write tests
# 6. Run: npm test

# 7. Test in Discord
# Restart bot and try /my-command
```

### Modify Existing Handler

```bash
# 1. Edit handler file
code src/app/handlers/core/PingHandler.js

# 2. Update tests if needed
code tests/unit/app/handlers/core/PingHandler.test.js

# 3. Run tests
npm test

# 4. Verify in Discord
```

### Add Middleware

```bash
# 1. Create middleware
code src/app/middleware/MyMiddleware.js

# 2. Extend middleware base (usually)
# 3. Implement handle() method

# 4. Register in CommandBus
# 5. Test it

# 6. Create tests
code tests/unit/app/middleware/MyMiddleware.test.js
```

### Update Database Schema

```bash
# 1. Edit schema
code src/schema-enhancement.js

# 2. Update repositories if needed
code src/infra/db/Repositories.js

# 3. Delete database.db (will be recreated)
rm database.db

# 4. Run bot to recreate schema
npm start

# 5. Test with queries
```

### Fix a Bug

```bash
# 1. Find bug in code or tests
# 2. Create test case that fails
npm test -- --testNamePattern="bug"

# 3. Fix the bug
code src/...

# 4. Test passes
npm test

# 5. Commit fix
git commit -m "fix: description of fix"
```

---

## Useful Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- PingHandler.test.js

# Run tests matching pattern
npm test -- --testNamePattern="permission"

# Check code style
npm run lint

# Start bot
npm start

# Test specific unit tests
npm run test:unit

# Test specific integration tests
npm run test:integration
```

---

## Resource Files

| File                      | Purpose                            |
| ------------------------- | ---------------------------------- |
| `package.json`            | Dependencies and scripts           |
| `jest.config.js`          | Jest configuration                 |
| `.env`                    | Environment variables (not in git) |
| `.env.example`            | Example env file                   |
| `database.db`             | SQLite database (generated)        |
| `PHASE_1_COVERAGE_GAP.md` | Testing roadmap                    |

---

## Key Files to Know

| File                                   | Purpose              | When to Edit         |
| -------------------------------------- | -------------------- | -------------------- |
| `src/index.js`                         | Bot startup          | Adding new services  |
| `src/core/commands/CommandRegistry.js` | Command registration | Adding commands      |
| `src/app/bus/CommandBus.js`            | Command execution    | Changing flow        |
| `src/infra/db/Repositories.js`         | Database queries     | Adding DB operations |
| `tests/`                               | Test files           | When writing tests   |

---

## Next Steps

- [Best Practices](./12-BEST-PRACTICES.md) - Code standards
- [Adding Commands](./14-ADDING-COMMANDS.md) - Create new commands
- [Testing Guide](./15-TESTING.md) - Write tests
- [Architecture](./7-ARCHITECTURE.md) - Understand design

---

**Previous:** [API Reference](./13-API-REFERENCE.md) | **Next:** [Best Practices](./12-BEST-PRACTICES.md)
