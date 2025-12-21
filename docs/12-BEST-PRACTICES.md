# 12. Best Practices

Coding standards, patterns, and conventions for VeraBot development.

---

## Table of Contents

1. [Code Style](#code-style)
2. [File Organization](#file-organization)
3. [Naming Conventions](#naming-conventions)
4. [Command Implementation](#command-implementation)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Git Workflow](#git-workflow)
8. [Performance](#performance)
9. [Security](#security)
10. [Documentation](#documentation)

---

## Code Style

### JavaScript Standards

**Use ES6+ features:**

```javascript
// ✅ GOOD
const user = { name: 'John', age: 30 };
const { name } = user;
const result = data.map((x) => x * 2).filter((x) => x > 5);
const promise = new Promise((resolve) => {});

// ❌ AVOID
var user = { name: 'John', age: 30 };
user = user || {};
result = data.reduce((a, x) => (x * 2 > 5 ? [...a, x * 2] : a), []);
```

**Prefer async/await over promises:**

```javascript
// ✅ GOOD
async function fetchUser(id) {
  try {
    const user = await db.getUser(id);
    return user;
  } catch (error) {
    logger.error({ error, userId: id });
    throw new DomainError('User not found');
  }
}

// ❌ AVOID
function fetchUser(id) {
  return db
    .getUser(id)
    .then((user) => user)
    .catch((error) => {
      console.log(error);
      throw error;
    });
}
```

**Use strict equality:**

```javascript
// ✅ GOOD
if (value === undefined) {
}
if (count > 0) {
}

// ❌ AVOID
if (value == undefined) {
}
if (count) {
} // Could be false, 0, '', null
```

### Formatting

- **Indentation:** 2 spaces
- **Line Length:** 100 characters (soft limit, 120 hard limit)
- **Semicolons:** Required
- **Trailing Commas:** Yes (ES5+)
- **Quotes:** Single quotes for strings

```javascript
// ✅ GOOD
const config = {
  host: 'localhost',
  port: 3000,
  debug: true, // trailing comma
};

// ❌ AVOID
const config = {
  host: 'localhost',
  port: 3000,
  debug: true, // no trailing comma
};
```

### Linting

Run before committing:

```bash
npm run lint
```

ESLint is configured in `jest.config.js`. All code must pass linting.

---

## File Organization

### Structure

```
src/
├── app/
│   ├── handlers/
│   │   ├── admin/          # Admin-only commands
│   │   ├── core/           # Core bot commands
│   │   ├── messaging/      # Message-related commands
│   │   └── operations/     # Operations commands
│   ├── bus/                # Command bus
│   └── middleware/         # Request middleware
├── core/
│   ├── commands/           # Command abstractions
│   ├── services/           # Core services
│   └── errors/             # Error classes
├── infra/
│   ├── db/                 # Database layer
│   ├── discord/            # Discord integration
│   ├── queue/              # Job queue
│   ├── ws/                 # WebSocket
│   ├── http/               # HTTP servers
│   └── config/             # Configuration
└── interfaces/
    └── http/               # HTTP endpoints
```

### File Naming

- **Handlers:** `PascalCase` + `Handler` suffix
  - `PingHandler.js`
  - `DeployHandler.js`
- **Services:** `PascalCase` + `Service` suffix
  - `PermissionService.js`
  - `CommandService.js`
- **Factories:** `PascalCase` + `Factory` suffix
  - `DiscordClientFactory.js`
  - `WsClientFactory.js`
- **Adapters:** `PascalCase` + `Adapter` suffix
  - `SlashCommandAdapter.js`
  - `WsAdapter.js`
- **Utilities:** `kebab-case.js`
  - `response-helpers.js`
  - `error-handler.js`

---

## Naming Conventions

### Variables & Functions

```javascript
// ✅ GOOD - Clear, descriptive names
const MAX_RETRIES = 3;
const userId = interaction.user.id;
const isAuthorized = await checkPermission(userId);
function formatUserMessage(user, message) {}
async function saveAuditLog(action, userId) {}

// ❌ AVOID - Cryptic, single-letter names
const m = 3;
const u = i.user.id;
const a = await check(u);
function fmt(u, m) {}
async function save(a, u) {}
```

### Constants

```javascript
// ✅ GOOD - UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000;
const DISCORD_API_VERSION = 'v10';
const RATE_LIMIT_WINDOW_MS = 60000;

// ❌ AVOID
const defaultTimeout = 5000;
const discordApiVersion = 'v10';
```

### Classes

```javascript
// ✅ GOOD - PascalCase
class CommandBus {}
class PermissionService {}
class DiscordClientFactory {}

// ❌ AVOID
class commandBus {}
class permission_service {}
class discord_client_factory {}
```

### Event Handlers

```javascript
// ✅ GOOD - onXxx or handleXxx
function onMessageCreate(message) {}
function handlePermissionError(error) {}

// ❌ AVOID
function message_create(message) {}
function permissionErrorHandler(error) {}
```

---

## Command Implementation

### Template

```javascript
const Command = require('../../core/commands/Command');
const { validateInput } = require('../../core/services/ValidationService');

class MyCommandHandler {
  constructor(dependencies) {
    this.service = dependencies.service;
    this.logger = dependencies.logger;
  }

  /**
   * Handles the command execution
   * @param {Command} command - The command to execute
   * @returns {Promise<any>} Command result
   * @throws {DomainError} On validation or business logic errors
   */
  async handle(command) {
    // 1. Validate input
    validateInput(command.args, {
      required: ['arg1'],
      types: { arg1: 'string' },
    });

    // 2. Extract arguments
    const [arg1, arg2] = command.args;

    // 3. Execute business logic
    const result = await this.service.doSomething(arg1, arg2);

    // 4. Log operation
    this.logger.info({ command: command.name, result });

    // 5. Return result
    return result;
  }
}

module.exports = MyCommandHandler;
```

### Key Points

1. **Document functions** with JSDoc comments
2. **Validate input** before processing
3. **Log important operations** with context
4. **Throw specific errors** (PermissionError, DomainError, etc.)
5. **Use dependency injection** for services
6. **Handle errors** in try-catch if needed
7. **Return clear results** (objects, not raw values)

### Error Handling in Commands

```javascript
// ✅ GOOD - Specific error types
if (!user) {
  throw new DomainError('User not found');
}

if (!(await permission.check(userId))) {
  throw new PermissionError('Insufficient permissions');
}

if (attempts > MAX_ATTEMPTS) {
  throw new RateLimitError('Too many attempts');
}

// ❌ AVOID - Generic errors or no error
if (!user) {
  throw new Error('bad');
}

if (!(await permission.check(userId))) {
  return { error: 'no permission' }; // Inconsistent error handling
}
```

---

## Error Handling

### Error Hierarchy

```
Error (Built-in)
  └── DomainError (Business logic errors)
      ├── PermissionError (Permission denied)
      ├── RateLimitError (Rate limit exceeded)
      └── ValidationError (Invalid input)
```

### Usage

```javascript
// ✅ GOOD
throw new PermissionError('User lacks admin role');
throw new RateLimitError('Command rate limited');
throw new DomainError('Invalid operation');

// ❌ AVOID
throw new Error('error'); // Generic, not specific
return { error: 'message' }; // Not thrown
throw 'string error'; // Invalid
```

### Try-Catch Best Practices

```javascript
// ✅ GOOD
try {
  const result = await operation();
} catch (error) {
  if (error instanceof PermissionError) {
    // Handle permission error
  } else if (error instanceof RateLimitError) {
    // Handle rate limit error
  } else {
    logger.error({ error }, 'Unexpected error');
    throw error;
  }
}

// ❌ AVOID
try {
  const result = await operation();
} catch (error) {
  console.log('Error:', error); // Generic logging
  return null; // Silently fail
}
```

---

## Testing

### Test Structure

```javascript
describe('MyFeature', () => {
  let service;
  let repository;

  beforeEach(() => {
    repository = { getData: jest.fn() };
    service = new MyService(repository);
  });

  it('should do something', async () => {
    // Arrange
    repository.getData.mockResolvedValue({ id: 1 });

    // Act
    const result = await service.process();

    // Assert
    expect(result).toEqual({ id: 1 });
    expect(repository.getData).toHaveBeenCalled();
  });
});
```

### Best Practices

- **One assertion per test** (or related assertions)
- **Clear test names** describing expected behavior
- **Mock external dependencies** (DB, API, etc.)
- **Test happy path and error scenarios**
- **Use Arrange-Act-Assert pattern**
- **Keep tests isolated and independent**

See [Testing Guide](./15-TESTING.md) for detailed information.

---

## Git Workflow

### Branch Naming

```
feature/add-new-command      # New feature
fix/permission-bug           # Bug fix
docs/update-readme           # Documentation
refactor/improve-handlers    # Code improvement
test/add-handler-tests       # New tests
```

### Commit Messages

```
# ✅ GOOD
feat: add new permission handler
fix: resolve command registry memory leak
docs: update installation guide
test: add tests for WsAdapter
refactor: simplify middleware pipeline

# ❌ AVOID
update
fixed bug
random changes
asdf
WIP
```

### Pull Request

1. Branch from `main`
2. Make focused changes (single feature/fix)
3. Write tests for changes
4. Run `npm test` and ensure all pass
5. Run `npm run lint` and fix issues
6. Commit with clear messages
7. Create pull request with description
8. Request review

---

## Performance

### Database Queries

```javascript
// ✅ GOOD - Use prepared statements
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// ❌ AVOID - String concatenation
const user = db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

### Async Operations

```javascript
// ✅ GOOD - Parallel when independent
const [users, permissions] = await Promise.all([db.getAllUsers(), db.getAllPermissions()]);

// ❌ AVOID - Sequential when parallel possible
const users = await db.getAllUsers();
const permissions = await db.getAllPermissions();
```

### Logging

```javascript
// ✅ GOOD - Structured logging with context
logger.info({ userId, commandName, duration }, 'Command executed');
logger.error({ error, userId }, 'Permission check failed');

// ❌ AVOID - Unstructured logging
console.log('user', userId, 'command', commandName);
console.error('error');
```

---

## Security

### Input Validation

```javascript
// ✅ GOOD - Validate all inputs
const schema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
});

const validated = schema.parse(input);

// ❌ AVOID - Trusting user input
const userId = input.userId; // Could be anything
```

### SQL Injection Prevention

```javascript
// ✅ GOOD - Parameterized queries
db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// ❌ AVOID - String concatenation
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

### Permission Checks

```javascript
// ✅ GOOD - Check permissions before action
if (!(await permissionService.check(userId, 'admin'))) {
  throw new PermissionError('Admin required');
}

// ❌ AVOID - Trusting client-side checks
if (user.isAdmin) {
  // Client might lie
  // Do something
}
```

### Secrets Management

```javascript
// ✅ GOOD - Use environment variables
const token = process.env.DISCORD_TOKEN;
const redisPassword = process.env.REDIS_PASSWORD;

// ❌ AVOID - Hardcoding secrets
const token = 'abc123...';
const redisPassword = 'mypassword';
```

---

## Documentation

### Code Comments

```javascript
// ✅ GOOD - Explain WHY, not WHAT
// Redis connection is cached to avoid reconnecting on every query
const client = redis.createClient(config);

// ❌ AVOID - Obvious comments
// Get the user
const user = db.getUser(id);
```

### JSDoc

```javascript
// ✅ GOOD - Complete JSDoc
/**
 * Executes a command with all middleware and handlers
 * @param {Command} command - The command to execute
 * @param {Object} context - Execution context
 * @returns {Promise<CommandResult>} Execution result
 * @throws {PermissionError} If user lacks required permissions
 * @throws {RateLimitError} If command is rate limited
 */
async execute(command, context) {}

// ❌ AVOID - Incomplete or missing
function execute(cmd, ctx) {}
```

### README in Directories

Major directories should have README explaining contents:

```
src/infra/
├── README.md          # Infrastructure overview
├── db/
│   └── README.md      # Database layer details
└── discord/
    └── README.md      # Discord integration details
```

---

## Checklist Before Committing

- [ ] Code follows style guide (run `npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new code
- [ ] Coverage hasn't decreased
- [ ] Documentation updated if needed
- [ ] No console.log statements (use logger)
- [ ] No hardcoded secrets
- [ ] No commented-out code
- [ ] Error handling is comprehensive
- [ ] Performance impact assessed

---

## Tools & Setup

### ESLint Configuration

ESLint is configured in `jest.config.js`. Key rules:

- Enforce `const` over `var`
- Require semicolons
- Single quotes for strings
- Consistent naming

Run: `npm run lint`

### Testing Setup

Jest is configured for:

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- 70% coverage target

Run: `npm test`

### Pre-commit Hooks

Consider using Husky for automated checks:

```bash
npm install husky
npx husky install
```

This ensures linting and tests pass before commits.

---

## Quick Reference

| Topic           | Best Practice                       |
| --------------- | ----------------------------------- |
| **Variables**   | Use `const`, be descriptive         |
| **Functions**   | Single responsibility, document     |
| **Async**       | Use async/await, handle errors      |
| **Database**    | Parameterized queries only          |
| **Errors**      | Throw specific error types          |
| **Logging**     | Structured with context             |
| **Testing**     | Comprehensive, isolated, clear      |
| **Git**         | Focused commits, clear messages     |
| **Security**    | Validate input, check permissions   |
| **Performance** | Use indexes, parallelize operations |

---

## Resources

- [JavaScript Best Practices](https://github.com/airbnb/javascript)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Testing Best Practices](./15-TESTING.md)
- [Error Handling](./20-TROUBLESHOOTING.md)

---

**Previous:** [API Reference](./13-API-REFERENCE.md) | **Next:** [Adding Commands](./14-ADDING-COMMANDS.md)
