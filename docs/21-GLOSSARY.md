# 21. Glossary

Key terms and definitions used throughout VeraBot documentation and codebase.

---

## A

**Adapter** - A class that converts between different interfaces. E.g., SlashCommandAdapter converts Discord slash commands to internal Command objects.

**Audit Log** - Record of all permission changes and administrative actions performed on the bot.

**Async/Await** - JavaScript syntax for handling asynchronous operations. `async` marks a function, `await` pauses execution until promise resolves.

---

## B

**BullMQ** - Redis-based job queue library used for background job processing and scheduling.

**Bull Board** - Admin UI for monitoring and managing BullMQ job queues.

**Bootstrap** - The process of starting and initializing the application.

**Branch** - Git branch representing a line of development.

**Breakpoint** - Point in code where debugger pauses execution for inspection.

---

## C

**Command** - User request to the bot. Can be executed via slash command, prefix command, or WebSocket.

**Command Bus** - Central dispatcher that routes commands to appropriate handlers and middleware.

**Command Handler** - Class that implements business logic for a specific command.

**Command Registry** - Central registry tracking all available commands and their metadata.

**CRUD** - Create, Read, Update, Delete operations on data.

---

## D

**Dependency Injection (DI)** - Pattern where object dependencies are provided externally rather than created internally.

**Domain Error** - Error representing business logic violations (not technical errors).

**Discord.js** - JavaScript library for interacting with Discord API.

---

## E

**Embed** - Rich message format in Discord containing fields, colors, images, etc.

**ESLint** - JavaScript linter that checks code style and quality.

**Event** - Something that happens that the bot reacts to (e.g., message created, button clicked).

---

## F

**Factory** - Design pattern for creating objects. E.g., DiscordClientFactory creates Discord clients.

**Fork** - Copy of a repository under a different user/organization.

---

## G

**Git** - Version control system for tracking code changes.

**Guild** - Discord server.

**Guild ID** - Unique identifier for a Discord server.

---

## H

**Handler** - Function that processes a command or event.

**Health Check** - Verification that a service is running and operational.

---

## I

**Integration Test** - Test that verifies multiple components work together correctly.

**Interface** - Entry point for the bot (Discord, WebSocket, HTTP).

---

## J

**Jest** - JavaScript testing framework used in VeraBot.

**Job** - Discrete unit of work queued for background execution.

**Job Queue** - System for managing asynchronous work (implemented with BullMQ).

---

## K

**Kebab-Case** - Naming convention using hyphens: `my-file-name.js`.

---

## L

**Logging** - Recording of application events and state for debugging and monitoring.

**Linting** - Automated checking of code style and potential errors.

---

## M

**Middleware** - Code that processes requests/commands before they reach handlers. Can modify, validate, or block requests.

**Mock** - Fake object used in tests to simulate real behavior.

---

## N

**Node.js** - JavaScript runtime for server-side applications.

**npm** - Node package manager for managing dependencies.

---

## O

**OAuth2** - Protocol for Discord bot authorization.

**Observer Pattern** - Design pattern where objects notify others about state changes.

---

## P

**PascalCase** - Naming convention starting with capital letter: `MyClassName`.

**Payload** - Data sent with a command or request.

**Permission** - Access control rule determining who can execute a command.

**Pino** - Structured logging library used in VeraBot.

**Promise** - JavaScript object representing eventual completion of async operation.

**Prefix Command** - Command invoked by typing `!command-name`.

---

## R

**Race Condition** - Unpredictable behavior when multiple operations access same resource.

**Rate Limit** - Restriction on how frequently a command can be executed.

**Redis** - In-memory data store used for caching and job queues.

**Repository** - Data access layer providing abstraction over database.

**Role** - Discord permission level assigned to users/bots.

---

## S

**Schema** - Structure of a database defining tables and columns.

**Service** - Class providing business logic used by handlers.

**Singleton** - Pattern ensuring only one instance of an object exists.

**Slash Command** - Command invoked via Discord's `/` interface.

**SQLite** - Lightweight SQL database used for local persistence.

---

## T

**Test Suite** - Collection of related tests.

**Token** - Discord bot authentication credential.

---

## U

**Unit Test** - Test that verifies a single component in isolation.

**User ID** - Unique identifier for a Discord user.

---

## V

**Validation** - Verification that input meets requirements.

**Variable** - Named storage location for a value.

---

## W

**WebSocket** - Protocol for bidirectional communication between client and server.

**Worker** - Process that executes background jobs from the queue.

---

## X

**X-\* Headers** - Custom HTTP headers prefixed with 'X-'.

---

## Y

**YAML** - Human-readable data serialization format.

---

## Z

**Zod** - TypeScript-first schema validation library used in VeraBot.

---

## Related Documentation

- [Architecture](./7-ARCHITECTURE.md) - System design overview
- [Best Practices](./12-BEST-PRACTICES.md) - Coding conventions
- [API Reference](./13-API-REFERENCE.md) - API documentation

---

**Navigation:** [Home](./README.md) | [FAQ](./22-FAQ.md) | [Resources](./23-RESOURCES.md)
