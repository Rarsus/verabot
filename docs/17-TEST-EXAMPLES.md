# 17. Test Examples

Real test examples from the codebase.

---

## Handler Test Example

```javascript
const HelpHandler = require('../../../src/app/handlers/core/HelpHandler');
const { mockInteraction, mockUser } = require('../../mocks');

describe('HelpHandler', () => {
  let handler;
  let mockReply;

  beforeEach(() => {
    handler = new HelpHandler();
    mockReply = jest.fn();
  });

  test('should display help message', async () => {
    const interaction = mockInteraction({
      isCommand: () => true,
      commandName: 'help',
      reply: mockReply
    });

    await handler.handle(interaction);
    expect(mockReply).toHaveBeenCalled();
  });

  test('should include command list', async () => {
    const interaction = mockInteraction({
      reply: mockReply
    });

    await handler.handle(interaction);
    const callArgs = mockReply.mock.calls[0][0];
    expect(callArgs.content).toContain('Available commands');
  });
});
```

---

## Middleware Test Example

```javascript
const LoggingMiddleware = require('../../../src/app/middleware/LoggingMiddleware');

describe('LoggingMiddleware', () => {
  let middleware;
  let logger;

  beforeEach(() => {
    logger = { info: jest.fn(), error: jest.fn() };
    middleware = new LoggingMiddleware(logger);
  });

  test('should log command execution', async () => {
    const command = { name: 'test', execute: jest.fn() };
    await middleware.execute(command);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('test')
    );
  });

  test('should log errors', async () => {
    const command = {
      execute: jest.fn().mockRejectedValue(new Error('Test error'))
    };

    await expect(middleware.execute(command)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});
```

---

## Service Test Example

```javascript
const PermissionService = require('../../../src/core/services/PermissionService');
const { mockDatabase } = require('../../mocks');

describe('PermissionService', () => {
  let service;
  let db;

  beforeEach(() => {
    db = mockDatabase();
    service = new PermissionService(db);
  });

  test('should grant permission', async () => {
    await service.grantPermission('user123', 'admin');
    expect(db.insert).toHaveBeenCalledWith(
      'permissions',
      expect.objectContaining({ userId: 'user123' })
    );
  });

  test('should check permission', async () => {
    db.query.mockResolvedValue([{ userId: 'user123' }]);

    const has = await service.checkPermission('user123', 'admin');
    expect(has).toBe(true);
  });
});
```

---

## Repository Test Example

```javascript
const UserRepository = require('../../../src/infra/db/UserRepository');
const { mockDatabase } = require('../../mocks');

describe('UserRepository', () => {
  let repo;
  let db;

  beforeEach(() => {
    db = mockDatabase();
    repo = new UserRepository(db);
  });

  test('should find user by id', async () => {
    const mockUser = { id: '123', name: 'Test' };
    db.prepare().get.mockReturnValue(mockUser);

    const user = await repo.findById('123');
    expect(user).toEqual(mockUser);
  });

  test('should save new user', async () => {
    const user = { id: '123', name: 'Test' };
    await repo.save(user);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT')
    );
  });

  test('should throw on duplicate', async () => {
    db.prepare().run.mockImplementation(() => {
      throw new Error('UNIQUE constraint failed');
    });

    await expect(repo.save({ id: '123' }))
      .rejects.toThrow();
  });
});
```

---

## Integration Test Example

```javascript
const CommandBus = require('../../../src/app/bus/CommandBus');
const TestCommand = require('../fixtures/TestCommand');
const { mockLogger } = require('../../mocks');

describe('CommandBus Integration', () => {
  let bus;

  beforeEach(() => {
    bus = new CommandBus(mockLogger());
  });

  test('should execute command through pipeline', async () => {
    const command = new TestCommand();
    const result = await bus.dispatch(command);

    expect(result.isSuccess()).toBe(true);
  });

  test('should apply middleware in order', async () => {
    const log = [];
    bus.use((cmd, next) => {
      log.push('before');
      next();
      log.push('after');
    });

    await bus.dispatch(new TestCommand());
    expect(log).toEqual(['before', 'after']);
  });
});
```

---

**Previous:** [Coverage Strategy](./16-COVERAGE-STRATEGY.md) | **Next:** [Deployment](./18-DEPLOYMENT.md)
