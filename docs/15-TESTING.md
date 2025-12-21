# 15. Testing Guide

Comprehensive guide to writing and running tests in VeraBot.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Testing Patterns](#testing-patterns)
6. [Coverage](#coverage)
7. [Troubleshooting](#troubleshooting)

---

## Overview

VeraBot uses **Jest** as the testing framework with comprehensive test coverage across all layers.

### Testing Pyramid

```
          △
         ╱ ╲  Unit Tests (70%)
        ╱   ╲  - Fast, isolated
       ╱─────╲
      ╱       ╲ Integration Tests (20%)
     ╱  E2E    ╲ - Component interaction
    ╱───────────╲
   ╱   Manual    ╲ Manual Testing (10%)
  ╱───────────────╲ - User acceptance
```

### Test Statistics

```
Total Tests:      351+
Passing:          351+ (100%)
Coverage Target:  70%
Current:          47.57%
Test Suites:      39
```

---

## Test Structure

### Directory Layout

```
tests/
├── unit/
│   ├── app/
│   │   ├── bus/
│   │   │   ├── CommandBus.test.js
│   │   │   └── MiddlewarePipeline.test.js
│   │   ├── handlers/
│   │   │   ├── admin/
│   │   │   ├── core/
│   │   │   ├── messaging/
│   │   │   └── operations/
│   │   └── middleware/
│   ├── core/
│   │   ├── commands/
│   │   ├── services/
│   │   └── errors/
│   └── infra/
│       ├── db/
│       ├── discord/
│       ├── queue/
│       └── ws/
└── integration/
    ├── CommandBus.test.js
    └── handlers/
```

### Test File Naming

Convention: `{file}.test.js`

```
PingHandler.js      → PingHandler.test.js
CommandBus.js       → CommandBus.test.js
PermissionService.js → PermissionService.test.js
```

---

## Running Tests

### All Tests

```bash
npm test
```

Expected output:

```
PASS  tests/unit/core/commands/Command.test.js
PASS  tests/unit/app/handlers/core/PingHandler.test.js
...
Test Suites: 39 passed, 39 total
Tests:       351 passed, 351 total
```

### Watch Mode

Auto-rerun tests on file changes:

```bash
npm run test:watch
```

### Coverage Report

Generate detailed coverage report:

```bash
npm run test:coverage
```

Output includes:

- Statement coverage (lines executed)
- Branch coverage (if/else paths)
- Function coverage (functions called)
- Line coverage (lines executed)

### Specific Test File

```bash
npm test -- PingHandler.test.js
```

### Specific Test Suite

```bash
npm test -- --testNamePattern="should execute command"
```

### Coverage for Specific File

```bash
npm test -- --coverage src/core/commands/Command.js
```

---

## Writing Tests

### Basic Structure

```javascript
// PingHandler.test.js
const PingHandler = require('../../../src/app/handlers/core/PingHandler');
const Command = require('../../../src/core/commands/Command');

describe('PingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new PingHandler();
  });

  it('should respond with pong', async () => {
    const command = new Command({ name: 'ping' });
    const result = await handler.handle(command);
    expect(result).toBe('Pong!');
  });
});
```

### Anatomy of a Test

```javascript
describe('Feature', () => {
  // Test suite
  let dependencies; // Setup

  beforeEach(() => {
    // Before each test
    dependencies = createMocks();
  });

  it('should do something', () => {
    // Test case
    // Arrange - Set up test data
    const input = { id: 1 };

    // Act - Perform operation
    const result = myFunction(input);

    // Assert - Verify result
    expect(result).toBe(expectedValue);
  });

  afterEach(() => {
    // After each test
    jest.clearAllMocks();
  });
});
```

---

## Testing Patterns

### 1. Unit Testing a Handler

```javascript
describe('DeployHandler', () => {
  let handler;
  let mockService;
  let mockLogger;

  beforeEach(() => {
    mockService = {
      deploy: jest.fn().mockResolvedValue({ status: 'success' }),
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    handler = new DeployHandler(mockService, mockLogger);
  });

  it('should deploy with valid environment', async () => {
    const command = {
      name: 'deploy',
      args: ['production'],
    };

    const result = await handler.handle(command);

    expect(result.status).toBe('success');
    expect(mockService.deploy).toHaveBeenCalledWith('production');
  });

  it('should throw error on invalid environment', async () => {
    const command = {
      name: 'deploy',
      args: ['invalid'],
    };

    mockService.deploy.mockRejectedValue(new Error('Invalid env'));

    await expect(handler.handle(command)).rejects.toThrow();
  });
});
```

### 2. Mocking Dependencies

```javascript
// ✅ GOOD - Mock external dependencies
const mockDatabase = {
  query: jest.fn().mockResolvedValue([{ id: 1 }]),
};

// ❌ AVOID - Don't mock internal logic
const mockCommandBus = {
  execute: jest.fn(), // Only mock if external
};
```

### 3. Testing Async Operations

```javascript
// ✅ GOOD - Test async with async/await
it('should fetch user', async () => {
  const user = await userService.getUser(1);
  expect(user.id).toBe(1);
});

// ✅ ALSO GOOD - Return promise
it('should fetch user', () => {
  return userService.getUser(1).then((user) => {
    expect(user.id).toBe(1);
  });
});

// ❌ AVOID - Missing async/await
it('should fetch user', () => {
  userService.getUser(1);
  expect(user.id).toBe(1); // Might not wait for promise
});
```

### 4. Testing Error Scenarios

```javascript
// ✅ GOOD - Expect specific errors
it('should throw PermissionError', async () => {
  mockPermissionService.check.mockResolvedValue(false);

  await expect(handler.handle(command)).rejects.toThrow(PermissionError);
});

// ✅ ALSO GOOD - Check error message
it('should provide helpful error message', async () => {
  try {
    await handler.handle(command);
  } catch (error) {
    expect(error.message).toContain('Insufficient permissions');
  }
});
```

### 5. Testing Database Layer

```javascript
describe('UserRepository', () => {
  let repo;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({ id: 1, name: 'John' }),
        all: jest.fn().mockReturnValue([
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ]),
        run: jest.fn(),
      }),
    };
    repo = new UserRepository(mockDb);
  });

  it('should get user by id', () => {
    const user = repo.getUser(1);
    expect(user.name).toBe('John');
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'));
  });

  it('should list all users', () => {
    const users = repo.listUsers();
    expect(users).toHaveLength(2);
  });
});
```

### 6. Testing Middleware

```javascript
describe('PermissionMiddleware', () => {
  let middleware;
  let mockNext;
  let mockCommand;
  let mockPermissionService;

  beforeEach(() => {
    mockPermissionService = {
      check: jest.fn().mockResolvedValue(true),
    };
    mockNext = jest.fn().mockResolvedValue({ success: true });
    middleware = new PermissionMiddleware(mockPermissionService);
    mockCommand = { name: 'admin-command', userId: '123' };
  });

  it('should allow command with permissions', async () => {
    const result = await middleware.handle(mockCommand, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should block command without permissions', async () => {
    mockPermissionService.check.mockResolvedValue(false);

    await expect(middleware.handle(mockCommand, mockNext)).rejects.toThrow(PermissionError);
  });
});
```

### 7. Testing with Mocked Time

```javascript
describe('RateLimitService', () => {
  let service;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new RateLimitService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enforce rate limits', async () => {
    service.record('user1', 'ping');
    expect(service.check('user1', 'ping')).toBe(false); // Still limited

    jest.advanceTimersByTime(60000); // Advance 1 minute
    expect(service.check('user1', 'ping')).toBe(true); // Now allowed
  });
});
```

---

## Coverage Strategy

### Current Status

```
Coverage Report:
  Statements: 47.57% (Target: 70%)
  Branches:   49.45%
  Functions:  41.33%
  Lines:      47.34%
```

### Coverage Gaps (Phase 1)

Priority files needing tests:

1. `infra/db/Repositories.js` - 0% → target +5-6%
2. `infra/queue/JobQueueService.js` - 0% → target +2-3%
3. `infra/discord/SlashCommandRegistrar.js` - 11.6% → target +3-4%
4. `infra/ws/WsAdapter.js` - 0% → target +2-3%
5. `infra/di/container.js` - 0% → target +2-3%

See [Coverage Strategy](./16-COVERAGE-STRATEGY.md) for detailed roadmap.

### Checking Coverage

```bash
npm run test:coverage
```

View HTML report:

```bash
open coverage/lcov-report/index.html
```

---

## Troubleshooting

### Test Timeout

**Problem:** Test times out after 5 seconds

**Solution:** Increase timeout for slow tests

```javascript
it('should fetch data', async () => {
  // ... test
}, 10000); // 10 second timeout
```

### Mock Not Being Called

**Problem:** Expected mock call not detected

**Solution:** Verify mock setup and call timing

```javascript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(expectedArg);
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Async Test Not Waiting

**Problem:** Test fails with "expected promise, got undefined"

**Solution:** Return promise or use async/await

```javascript
// ✅ GOOD
return promise;
// or
async () => {
  await promise;
};

// ❌ BAD
promise; // Not waiting
```

### Module Not Found

**Problem:** Cannot find module when importing test file

**Solution:** Check import paths (relative to test file)

```javascript
// From: tests/unit/core/commands/Command.test.js
// Import from: src/core/commands/Command.js
const Command = require('../../../src/core/commands/Command');
```

### Jest Config Issues

**Problem:** Tests not running or wrong environment

**Solution:** Check `jest.config.js`

```bash
npm test -- --showConfig
```

---

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hook

```bash
#!/bin/bash
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed, commit aborted"
  exit 1
fi
```

---

## Best Practices

### ✅ DO

- Write tests alongside code
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Test happy path and error cases
- Keep tests fast and isolated
- Update tests when changing code
- Aim for high coverage (70%+)

### ❌ DON'T

- Test implementation details
- Create interdependent tests
- Use hardcoded test data
- Skip error scenario testing
- Write slow/flaky tests
- Test third-party libraries
- Ignore test failures
- Leave TODO tests

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](./12-BEST-PRACTICES.md#testing)
- [Test Examples](./17-TEST-EXAMPLES.md)
- [Coverage Strategy](./16-COVERAGE-STRATEGY.md)

---

**Previous:** [Coverage Strategy](./16-COVERAGE-STRATEGY.md) | **Next:** [Test Examples](./17-TEST-EXAMPLES.md)
