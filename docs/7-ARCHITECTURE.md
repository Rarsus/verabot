# 7. System Architecture

Understand the overall design and structure of VeraBot.

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Architectural Layers](#architectural-layers)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Communication Patterns](#communication-patterns)
6. [Technology Stack](#technology-stack)
7. [Scalability & Performance](#scalability--performance)

---

## High-Level Overview

VeraBot follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           Discord & Web Interfaces           │
│  (Slash Commands, Prefix Commands, WebSocket)│
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Command Bus & Middleware             │
│  (Command execution, validation, routing)    │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Application Layer (Handlers)         │
│  (Command business logic, operations)        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│       Infrastructure & Services              │
│  (DB, Cache, Queue, Logging, Monitoring)    │
└─────────────────────────────────────────────┘
```

---

## Architectural Layers

### 1. **Interfaces Layer** (`src/interfaces/`)
Handles all external communication:

- **Discord Integration** - Slash commands, message parsing
- **HTTP Servers** - Health checks, metrics, admin UI
- **WebSocket** - Direct command execution over WebSocket
- **Response Formatting** - Embeds, error messages

**Responsibilities:**
- Parse incoming commands/requests
- Validate input format
- Format responses for each interface
- Handle authentication/permissions

### 2. **Application Layer** (`src/app/`)
Business logic and command execution:

- **Command Bus** - Routes and executes commands
- **Handlers** - Command implementation (admin, core, messaging, operations)
- **Middleware Pipeline** - Cross-cutting concerns
- **Middleware Types:**
  - Logging - Track all operations
  - Audit - Record permission changes
  - Rate Limiting - Enforce command limits
  - Permissions - Check access control

**Responsibilities:**
- Implement command logic
- Enforce business rules
- Call appropriate services
- Handle errors gracefully

### 3. **Core Layer** (`src/core/`)
Core abstractions and services:

- **Command** - Command abstraction, structure, metadata
- **CommandRegistry** - Track all available commands
- **CommandResult** - Standardized execution result
- **Services:**
  - CommandService - Command lookup and execution
  - PermissionService - Permission checking
  - RateLimitService - Rate limit enforcement
  - HelpService - Generate help documentation

**Responsibilities:**
- Define command contract
- Manage command lifecycle
- Provide common services
- Abstract core functionality

### 4. **Infrastructure Layer** (`src/infra/`)
Technical infrastructure:

**Database:** SQLite with better-sqlite3
- Command allowance list
- Permission rules (roles, channels, users)
- Audit logs
- Rate limit tracking

**Job Queue:** BullMQ with Redis backend
- Heavy background work
- Cron job scheduling
- Job worker management
- Event handling

**Discord Integration:**
- DiscordClientFactory - Initialize Discord client
- SlashCommandAdapter - Handle slash commands
- SlashCommandRegistrar - Register commands with Discord
- EmbedFactory - Create rich Discord embeds

**WebSocket:**
- WsAdapter - WebSocket message handling
- WsClientFactory - Client creation

**HTTP Servers:**
- HealthMetricsServer - `/health`, `/metrics` endpoints
- BullBoardServer - Job queue admin UI

**Utilities:**
- Logger (Pino) - Structured logging
- HealthCheck - System health monitoring
- Metrics - Performance metrics collection

**Configuration:**
- Config - Application settings
- RedisConfig - Redis connection setup

---

## Core Components

### Command Bus
The central dispatcher for all commands:

```
┌──────────────┐
│ Raw Command  │ (from Discord, WebSocket, etc.)
└──────────────┘
       ↓
┌──────────────────────────────┐
│  CommandBus.execute()        │
│  1. Validate command         │
│  2. Route to middleware      │
│  3. Execute handler          │
└──────────────────────────────┘
       ↓
┌──────────────┐
│  CommandResult (success/error/data)
└──────────────┘
```

**Execution Flow:**
```javascript
const result = await bus.execute(command);

// Result structure:
{
  success: true|false,
  data: {...},        // Execution result
  error: {...}        // Error if failed
}
```

### Middleware Pipeline
Cross-cutting concerns applied in order:

```
Command → LoggingMiddleware → PermissionMiddleware → AuditMiddleware 
→ RateLimitMiddleware → Handler → Response
```

Each middleware can:
- Inspect the command
- Modify command metadata
- Block execution (throw error)
- Log information
- Enforce business rules

### Command Registry
Central registry of all available commands:

```javascript
registry.register(command);
const cmd = registry.get('ping');
const all = registry.listAll();
```

Maintains:
- Command metadata
- Handler references
- Permission mappings
- Documentation

---

## Data Flow

### 1. Slash Command Flow

```
User in Discord
       ↓
Discord API
       ↓
SlashCommandAdapter.handle(interaction)
       ↓
Create Command object
       ↓
CommandBus.execute(command)
       ↓
Middleware Pipeline (Logging → Permission → Audit → RateLimit)
       ↓
Command Handler (implementation)
       ↓
CommandResult
       ↓
Format response (embed/text)
       ↓
Send to Discord
```

### 2. WebSocket Command Flow

```
WebSocket Client
       ↓
WsAdapter.message handler
       ↓
Parse JSON
       ↓
Create Command object
       ↓
CommandBus.execute(command)
       ↓
[Same pipeline as slash]
       ↓
Send result via WebSocket
```

### 3. Job Queue Flow

```
Command triggers async work
       ↓
JobQueueService.enqueue()
       ↓
BullMQ Queue
       ↓
Redis (persistent storage)
       ↓
Worker process
       ↓
Execute job handler
       ↓
Success/failure event
       ↓
Cleanup
```

### 4. Permission Check Flow

```
Command received
       ↓
PermissionMiddleware
       ↓
PermissionService.check()
       ↓
CommandRepository.isAllowed(command)
       ↓
PermissionRepository.isAllowed(command, user, role, channel)
       ↓
Database query
       ↓
Allow / Block
       ↓
Handler execution or Error response
```

---

## Communication Patterns

### Request-Response (Discord Commands)
```
User Input → Command → Handler → Response → User
```
Synchronous, immediate feedback.

### Publish-Subscribe (Job Events)
```
Job Completed → Worker → Event Handler → Response
```
Asynchronous, deferred execution.

### Audit Trail
```
Permission Change → AuditMiddleware → AuditRepository → Database
```
All state changes logged for compliance.

### Health Checks
```
Periodic / Manual → HealthCheck service → HTTP response
```
System status monitoring.

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript execution |
| **Discord** | discord.js | 14.16 | Discord API client |
| **Job Queue** | BullMQ | 5.9 | Async job processing |
| **Cache/Queue** | Redis | 6.0+ | In-memory data store |
| **Database** | SQLite | 3.x | Local persistence |
| **HTTP** | Express | 4.21 | HTTP server framework |
| **Logging** | Pino | 9.0 | Structured logging |
| **Monitoring** | prom-client | 15.0 | Prometheus metrics |
| **WebSocket** | ws | 8.18 | WebSocket communication |
| **Testing** | Jest | 29.7 | Test framework |
| **Admin UI** | Bull-Board | 5.21 | Job queue admin |
| **Validation** | Zod | 3.23 | Schema validation |

---

## Scalability & Performance

### Horizontal Scaling
- **Job Queue:** Redis allows multiple workers
- **Stateless Design:** Each instance independent
- **Load Balancing:** Multiple bot instances with shared Redis

### Performance Optimizations
- **Database Indexing:** Fast permission lookups
- **Job Queue Workers:** Offload long operations
- **Caching:** Redis reduces database queries
- **Connection Pooling:** Reuse SQLite connections

### Monitoring
- **Health Checks:** `/health` endpoint
- **Metrics:** Prometheus format via `/metrics`
- **Job Queue Admin:** Bull Board UI
- **Structured Logging:** All operations logged with context

### Resource Usage
| Resource | Target | Notes |
|----------|--------|-------|
| Memory | < 200MB | Depends on job queue size |
| CPU | < 20% | Mostly idle (event-driven) |
| Disk | < 500MB | SQLite database size |
| Network | < 1 Mbps | Discord API traffic |

---

## Error Handling

**Multi-layer error strategy:**

1. **Input Validation** - Interfaces layer validates format
2. **Business Logic** - Services throw specific errors
3. **Middleware** - Catches and logs errors
4. **Handler** - Wraps in try-catch
5. **Response** - Returns standardized error format

**Error Types:**
- `PermissionError` - Access denied
- `RateLimitError` - Rate limit exceeded
- `DomainError` - Business rule violation
- `ValidationError` - Invalid input

All errors logged with full context for debugging.

---

## Design Principles

1. **Separation of Concerns** - Each layer has single responsibility
2. **Dependency Injection** - Services loosely coupled
3. **Command Pattern** - Commands are first-class objects
4. **Middleware Pattern** - Cross-cutting concerns separate
5. **Repository Pattern** - Data access abstraction
6. **Factory Pattern** - Object creation standardized
7. **Service Layer** - Business logic centralized

---

## Sequence Diagram: Command Execution

```
┌─────────┐         ┌──────────┐        ┌─────────────┐       ┌─────────┐
│ Discord │         │ Adapter  │        │ CommandBus  │       │ Handler │
└────┬────┘         └────┬─────┘        └──────┬──────┘       └────┬────┘
     │                   │                      │                   │
     │ slash command     │                      │                   │
     ├──────────────────→│                      │                   │
     │                   │                      │                   │
     │                   │ execute(command)     │                   │
     │                   ├─────────────────────→│                   │
     │                   │                      │                   │
     │                   │                      │ [Middleware]      │
     │                   │                      │ [Permission]      │
     │                   │                      │ [Audit]           │
     │                   │                      │                   │
     │                   │                      │ handle()          │
     │                   │                      ├──────────────────→│
     │                   │                      │                   │
     │                   │                      │         result    │
     │                   │                      │←──────────────────┤
     │                   │                      │                   │
     │                   │    CommandResult     │                   │
     │                   │←─────────────────────┤                   │
     │                   │                      │                   │
     │  embed/response   │                      │                   │
     │←──────────────────┤                      │                   │
     │                   │                      │                   │
```

---

## Next Steps

- **[Command Architecture](./8-COMMAND-ARCHITECTURE.md)** - How commands work
- **[Infrastructure Guide](./9-INFRASTRUCTURE.md)** - Infrastructure details
- **[Design Patterns](./10-DESIGN-PATTERNS.md)** - Patterns used throughout
- **[Development Guide](./11-DEVELOPMENT.md)** - Getting started developing

---

**Previous:** [Permissions](./6-PERMISSIONS.md) | **Next:** [Command Architecture](./8-COMMAND-ARCHITECTURE.md)
