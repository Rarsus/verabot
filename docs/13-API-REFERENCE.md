# API Reference

**Generated:** 2025-12-22T12:34:31.173Z

This is an auto-generated API reference. For more details, see the source code JSDoc comments.

## Table of Contents

- [Core](#core)
  - [Commands](#commands)
  - [Services](#services)
  - [Errors](#errors)
- [Infrastructure](#infrastructure)
  - [Configuration](#configuration)
  - [Database](#database)
  - [Discord Integration](#discord-integration)
  - [Logging](#logging)
  - [Metrics](#metrics)
  - [Job Queue](#job-queue)
  - [WebSocket](#websocket)
- [Application](#application)
  - [Handlers](#handlers)
  - [Middleware](#middleware)

## Core

### Commands

### `Command`

**Type:** class
**File:** `core/commands/Command.js`

Represents a command with execution context

### `CommandRegistry`

**Type:** class
**File:** `core/commands/CommandRegistry.js`

Registry for storing and retrieving command handlers and metadata

### `CommandResult`

**Type:** class
**File:** `core/commands/CommandResult.js`

Represents the result of a command execution

### Services

### `CommandService`

**Type:** class
**File:** `core/services/CommandService.js`

Service for managing command allowlist

### `HelpService`

**Type:** class
**File:** `core/services/HelpService.js`

Service for providing command help and documentation

### `PermissionService`

**Type:** class
**File:** `core/services/PermissionService.js`

Service for checking command execution permissions

### `RateLimitService`

**Type:** class
**File:** `core/services/RateLimitService.js`

Service for enforcing rate limits on command execution

### Errors

### `DomainError`

**Type:** class
**File:** `core/errors/DomainError.js`

Base error class for domain-specific errors

### `PermissionError`

**Type:** class
**File:** `core/errors/PermissionError.js`

Error thrown when a command lacks required permissions

### `RateLimitError`

**Type:** class
**File:** `core/errors/RateLimitError.js`

Error thrown when a rate limit is exceeded

## Infrastructure

### Configuration

### `ConfigSchema`

**Type:** function
**File:** `infra/config/Config.js`

Zod schema for validating application configuration

### `createConfig`

**Type:** function
**File:** `infra/config/Config.js`

Create and validate application configuration

**Returns:**

- **Type:** `Object`
- **Description:** Validated configuration object with all required and optional fields

### `RedisSchema`

**Type:** function
**File:** `infra/config/RedisConfig.js`

Zod schema for Redis configuration validation

### `loadRedisConfig`

**Type:** function
**File:** `infra/config/RedisConfig.js`

Load and validate Redis configuration from environment variables

**Parameters:**

| Name  | Type     | Description                  |
| ----- | -------- | ---------------------------- |
| `env` | `Object` | Environment variables object |

**Returns:**

- **Type:** `Object`
- **Description:** Validated Redis configuration

### Database

### `createRedisConnection`

**Type:** function
**File:** `infra/db/RedisFactory.js`

Create a Redis connection instance with event listeners

**Parameters:**

| Name          | Type     | Description                                 |
| ------------- | -------- | ------------------------------------------- | ------------------------------------------- |
| `redisConfig` | `Object` | Redis configuration                         |
| `redisConfig` | `string` | .REDIS_HOST - Redis server hostname         |
| `redisConfig` | `string  | number`                                     | .REDIS_PORT - Redis server port             |
| `redisConfig` | `string  | undefined`                                  | .REDIS_PASSWORD - Redis password (optional) |
| `logger`      | `Object` | Logger instance for connection/error events |

**Returns:**

- **Type:** `Redis`
- **Description:** Configured ioredis Redis client instance

### `createCommandRepository`

**Type:** function
**File:** `infra/db/Repositories.js`

Create command repository for managing allowed commands

**Parameters:**

| Name | Type     | Description                           |
| ---- | -------- | ------------------------------------- |
| `db` | `Object` | Database instance with raw connection |

**Returns:**

- **Type:** `Object`
- **Description:** Command repository with methods: isAllowed, listAllowed, addAllowed, removeAllowed

### `createPermissionRepository`

**Type:** function
**File:** `infra/db/Repositories.js`

Create permission repository for managing command permissions

**Parameters:**

| Name | Type     | Description                           |
| ---- | -------- | ------------------------------------- |
| `db` | `Object` | Database instance with raw connection |

**Returns:**

- **Type:** `Object`
- **Description:** Permission repository with methods for role, channel, and user permissions

### `createAuditRepository`

**Type:** function
**File:** `infra/db/Repositories.js`

Create audit repository for logging command execution

**Parameters:**

| Name | Type     | Description                           |
| ---- | -------- | ------------------------------------- |
| `db` | `Object` | Database instance with raw connection |

**Returns:**

- **Type:** `Object`
- **Description:** Audit repository with log method

### `createRateLimitRepository`

**Type:** function
**File:** `infra/db/Repositories.js`

Create rate limit repository for tracking command usage

**Parameters:**

| Name | Type     | Description                           |
| ---- | -------- | ------------------------------------- |
| `db` | `Object` | Database instance with raw connection |

**Returns:**

- **Type:** `Object`
- **Description:** Rate limit repository with methods: getLastUsed, setLastUsed

### `createQuoteRepository`

**Type:** function
**File:** `infra/db/Repositories.js`

Create quote repository for managing quotes

**Parameters:**

| Name | Type     | Description                           |
| ---- | -------- | ------------------------------------- |
| `db` | `Object` | Database instance with raw connection |

**Returns:**

- **Type:** `Object`
- **Description:** Quote repository with methods for CRUD operations

### `createRepositories`

**Type:** function
**File:** `infra/db/Repositories.js`

Create all repository instances

**Parameters:**

| Name     | Type     | Description       |
| -------- | -------- | ----------------- |
| `db`     | `Object` | Database instance |
| `logger` | `Object` | Logger instance   |

**Returns:**

- **Type:** `Object`
- **Description:** Object containing all repositories

### `createDb`

**Type:** function
**File:** `infra/db/SqliteDb.js`

Create and initialize SQLite database connection

**Parameters:**

| Name     | Type     | Description                                                                      |
| -------- | -------- | -------------------------------------------------------------------------------- |
| `config` | `Object` | Application configuration (not directly used but available for future expansion) |
| `logger` | `Object` | Logger instance for logging initialization                                       |

**Returns:**

- **Type:** `Object`
- **Description:** Database wrapper object

### Discord Integration

### `createDiscordClient`

**Type:** function
**File:** `infra/discord/DiscordClientFactory.js`

Factory function to create a Discord.js client with proper configuration

**Parameters:**

| Name     | Type     | Description                |
| -------- | -------- | -------------------------- |
| `config` | `Object` | Bot configuration          |
| `config` | `string` | .token - Discord bot token |
| `logger` | `Object` | Logger instance            |

**Returns:**

- **Type:** `Client`
- **Description:** Configured Discord client with event listeners

### `EmbedFactory`

**Type:** class
**File:** `infra/discord/EmbedFactory.js`

Factory for creating standardized Discord embeds for various command outputs

### `SlashCommandAdapter`

**Type:** class
**File:** `infra/discord/SlashCommandAdapter.js`

Adapter for handling Discord.js slash command interactions

### `applyOptionsToSubcommand`

**Type:** function
**File:** `infra/discord/SlashCommandRegistrar.js`

Helper function to apply command options to a slash subcommand

**Parameters:**

| Name      | Type            | Description                                                           |
| --------- | --------------- | --------------------------------------------------------------------- |
| `sub`     | `Subcommand`    | Discord.js subcommand object                                          |
| `options` | `Array<Object>` | Array of option definitions                                           |
| `options` | `string`        | [].name - Option name                                                 |
| `options` | `string`        | [].type - Option type (string, integer, boolean, user, role, channel) |
| `options` | `string`        | [].description - Option description                                   |
| `options` | `boolean`       | [].required - Whether option is required                              |
| `options` | `boolean`       | [].autocomplete - Whether option supports autocomplete                |
| `options` | `Array<Object>` | [].choices - Predefined choices for option                            |

**Returns:**

- **Type:** `void`
- **Description:** \* @private

### `SlashCommandRegistrar`

**Type:** class
**File:** `infra/discord/SlashCommandRegistrar.js`

Registrar for Discord slash commands

### Metrics

### `createMetrics`

**Type:** function
**File:** `infra/metrics/Metrics.js`

Create Prometheus metrics collectors

**Returns:**

- **Type:** `Object`
- **Description:** Metrics object with Prometheus client and counter instances

### Job Queue

### `JobQueueService`

**Type:** class
**File:** `infra/queue/JobQueueService.js`

Background job queue service using BullMQ

### `Scheduler`

**Type:** class
**File:** `infra/queue/Scheduler.js`

Scheduler for managing cron jobs and recurring tasks

### WebSocket

### `WsAdapter`

**Type:** class
**File:** `infra/ws/WsAdapter.js`

Adapter for handling WebSocket command interactions

### `createWsClient`

**Type:** function
**File:** `infra/ws/WsClientFactory.js`

Create a WebSocket client with automatic reconnection

**Parameters:**

| Name     | Type     | Description                                                |
| -------- | -------- | ---------------------------------------------------------- |
| `config` | `Object` | Configuration object                                       |
| `config` | `string` | .WS_URL - WebSocket server URL (e.g., ws://localhost:8080) |
| `logger` | `Object` | Logger instance for connection events                      |

**Returns:**

- **Type:** `Object`
- **Description:** WebSocket client holder

## Application
