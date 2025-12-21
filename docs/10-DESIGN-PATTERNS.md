# 10. Design Patterns

Design patterns used throughout the codebase.

---

## Command Pattern

Commands encapsulate operations as first-class objects.

```javascript
class MyCommand extends Command {
  async execute(input) {
    // Command logic
  }
}

const command = new MyCommand();
await bus.dispatch(command);
```

---

## Middleware Pattern

Pipeline of concerns applied to requests.

```javascript
pipeline.use(new LoggingMiddleware());
pipeline.use(new PermissionMiddleware());
pipeline.use(new RateLimitMiddleware());

await pipeline.execute(request);
```

---

## Repository Pattern

Abstract data access layer.

```javascript
class UserRepository {
  async getById(id) { }
  async save(user) { }
  async delete(id) { }
}
```

---

## Factory Pattern

Create complex objects without exposing creation logic.

```javascript
const client = DiscordClientFactory.create(config);
const db = SqliteFactory.create(path);
```

---

## Service Layer Pattern

Business logic separated from persistence.

```javascript
class PermissionService {
  async checkPermission(user, command) { }
}
```

---

## Dependency Injection

Container manages dependencies.

```javascript
const container = new DIContainer();
container.register('db', sqliteInstance);
container.register('commandBus', busInstance);
```

---

## Observer Pattern

Event emitters for decoupled communication.

```javascript
client.on('ready', () => console.log('Ready'));
client.on('interactionCreate', (interaction) => {});
```

---

**Previous:** [Infrastructure](./9-INFRASTRUCTURE.md) | **Next:** [Development](./11-DEVELOPMENT.md)
