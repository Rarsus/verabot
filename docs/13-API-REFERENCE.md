# 13. API Reference

Public APIs and interfaces for developers.

---

## Command Interface

```javascript
class Command {
  constructor(metadata);
  async execute(input);
  getMetadata();
  getResult();
}
```

### Example

```javascript
const result = await command.execute({ userId: '123' });
```

---

## CommandBus

```javascript
class CommandBus {
  async dispatch(command);
  subscribe(commandType, handler);
}
```

### Usage

```javascript
await bus.dispatch(new MyCommand(data));
```

---

## CommandResult

```javascript
class CommandResult {
  constructor(success, data, message);
  isSuccess();
  getData();
  getMessage();
}
```

---

## PermissionService

```javascript
class PermissionService {
  async checkPermission(userId, commandName);
  async grantPermission(userId, commandName);
  async revokePermission(userId, commandName);
}
```

---

## RateLimitService

```javascript
class RateLimitService {
  async isAllowed(userId, commandName);
  async recordUsage(userId, commandName);
  async reset(userId);
}
```

---

## Error Classes

- `DomainError` - Business logic errors
- `PermissionError` - Unauthorized access
- `RateLimitError` - Rate limit exceeded
- `ValidationError` - Invalid input

---

**Previous:** [Best Practices](./12-BEST-PRACTICES.md) | **Next:** [Adding Commands](./14-ADDING-COMMANDS.md)
