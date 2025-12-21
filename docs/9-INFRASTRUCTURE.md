# 9. Infrastructure Layer

Details about database, job queue, WebSocket, and HTTP infrastructure.

---

## Database Layer (SQLite)

### Schema

**Tables:**

- `allowed_commands` - Allowed commands
- `command_roles` - Role permissions
- `command_channels` - Channel permissions
- `command_users` - User permissions
- `audit_logs` - Audit trail
- `rate_limits` - Rate limit tracking

### Repositories

- `CommandRepository` - Command allowance
- `PermissionRepository` - Permissions
- `AuditRepository` - Audit logs
- `RateLimitRepository` - Rate limits

### Query Example

```javascript
const db = require('./db');
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

---

## Job Queue (BullMQ + Redis)

### Job Types

- `heavywork` - Long-running operations
- `cron:*` - Scheduled jobs
- `deploy` - Deployment jobs

### Enqueueing

```javascript
await queue.enqueue(
  'heavywork',
  {
    data: 'important',
  },
  {
    priority: 5,
    delay: 1000,
    attempts: 3,
  }
);
```

---

## WebSocket

### Message Format

```json
{
  "type": "command",
  "command": "ping",
  "args": [],
  "userId": "123"
}
```

### Response

```json
{
  "type": "response",
  "command": "ping",
  "result": "Pong!"
}
```

---

## HTTP Endpoints

### Health Check

```
GET /health

Response:
{
  "status": "healthy",
  "uptime": 3600
}
```

### Metrics

```
GET /metrics

Response: Prometheus format metrics
```

### Job Queue Admin

```
GET /admin/queues

Returns: Bull Board UI
```

---

**Previous:** [Command Architecture](./8-COMMAND-ARCHITECTURE.md) | **Next:** [Design Patterns](./10-DESIGN-PATTERNS.md)
