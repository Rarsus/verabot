# 8. Command Architecture

Deep dive into how commands work in VeraBot.

---

## Command Lifecycle

```
┌──────────────┐
│ Raw Input    │  (Discord slash, prefix, WebSocket)
└──────┬───────┘
       │
┌──────▼──────────────┐
│ Interface Adapter   │  (Parse input, create Command)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ Command Object      │  (name, args, userId, etc.)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ CommandBus.execute  │  (Route through middleware)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ Middleware Chain    │  (Logging, Permissions, Audit)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ Handler.handle()    │  (Execute business logic)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ CommandResult       │  (success, data, error)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ Format Response     │  (Embed, text, etc.)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│ Send to User        │  (Discord, WebSocket, etc.)
└──────────────────────┘
```

---

## Command Structure

### Command Object

```javascript
{
  name: 'deploy',                    // Command identifier
  source: 'discord',                 // Where from (discord, websocket, prefix)
  userId: '123456789',               // Who executed
  channelId: '987654321',            // Where executed
  guildId: '111111111',              // Discord guild
  args: ['production'],              // Arguments
  metadata: {                        // Extra info
    timestamp: 1234567890,
    ip: '192.168.1.1'
  }
}
```

### Command Result

```javascript
{
  success: true,                     // Execution succeeded
  data: {                           // Result data
    message: 'Deployed successfully',
    jobId: 'deploy-123'
  },
  error: null                       // Error if failed
}
```

---

## Middleware Pipeline

Middleware intercepts commands before handlers:

```javascript
// Example middleware
class MyMiddleware {
  async handle(command, next) {
    // Before
    console.log('Command:', command.name);
    
    // Execute next middleware/handler
    const result = await next();
    
    // After
    console.log('Result:', result);
    
    return result;
  }
}
```

### Built-in Middleware

1. **LoggingMiddleware** - Log all operations
2. **PermissionMiddleware** - Check permissions
3. **AuditMiddleware** - Record changes
4. **RateLimitMiddleware** - Enforce limits

---

## Handler Implementation

### Basic Handler

```javascript
class MyHandler {
  async handle(command) {
    // Validate input
    if (!command.args[0]) {
      throw new Error('Missing argument');
    }

    // Execute logic
    const result = await this.service.doSomething(command.args[0]);

    // Return result
    return result;
  }
}
```

### Handler with Dependencies

```javascript
class MyHandler {
  constructor(service, logger) {
    this.service = service;
    this.logger = logger;
  }

  async handle(command) {
    try {
      this.logger.info(`Executing ${command.name}`);
      const result = await this.service.doSomething();
      return result;
    } catch (error) {
      this.logger.error({ error });
      throw error;
    }
  }
}
```

---

## Command Registration

Commands auto-register via CommandRegistry:

```javascript
// In handler file
class MyHandler {
  // ... implementation
}

// Register with metadata
MyHandler.metadata = {
  name: 'my-command',
  description: 'What it does',
  aliases: ['alias1', 'alias2'],
  args: [
    { name: 'arg1', required: true, description: '...' }
  ]
};

module.exports = MyHandler;
```

---

## Next Steps

- [Infrastructure](./9-INFRASTRUCTURE.md) - Database, Queue, WebSocket
- [Design Patterns](./10-DESIGN-PATTERNS.md) - Patterns used
- [Adding Commands](./14-ADDING-COMMANDS.md) - Create new commands

---

**Previous:** [Architecture](./7-ARCHITECTURE.md) | **Next:** [Infrastructure](./9-INFRASTRUCTURE.md)
