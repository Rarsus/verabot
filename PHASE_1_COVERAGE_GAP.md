# Phase 1: Test Coverage Gap Analysis

**Date:** December 21, 2025  
**Current Coverage:** 47.57% statements (Target: 70%)  
**Gap:** 22.43 percentage points  
**Test Suites:** 39 passing (351 tests)

---

## Executive Summary

The codebase has solid coverage for core command handlers (100%), middleware (100%), and core services (100%), but significant gaps exist in the infrastructure layer. The main blockers to reaching 70% coverage are **10 files with 0% coverage** and 4 files with critically low coverage (<50%).

Recommended approach: Focus on the **7 highest-impact files** in Tier 1, which collectively should yield the 22.43% gain needed to reach 70%.

---

## Coverage Breakdown by Layer

| Layer | Files | Coverage | Status |
|-------|-------|----------|--------|
| **Command Handlers** | 20 | 100% | ✓ Complete |
| **Middleware** | 4 | 100% | ✓ Complete |
| **Core Services** | 4 | 100% | ✓ Complete |
| **Core Commands** | 3 | 100% | ✓ Complete |
| **Core Errors** | 3 | 100% | ✓ Complete |
| **Health & Logging** | 2 | 100% | ✓ Complete |
| **Infrastructure** | 18 | 18% | ⚠️ Critical Gap |
| **Discord Integration** | 5 | 35% | ⚠️ Major Gap |

---

## TIER 1: Zero Coverage Files (Highest Impact)

These 10 files have **0% coverage** and represent the largest opportunity for coverage gains.

### 1. **`infra/db/Repositories.js`** (124 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +5-6%
- **Priority:** CRITICAL (Largest file, core infrastructure)
- **Functions to test:**
  - `createCommandRepository()` - Check command allowance, list, add, remove
  - `createPermissionRepository()` - Role/channel/user permission checks
  - `createAuditRepository()` - Audit logging operations
  - `createRateLimitRepository()` - Rate limit enforcement
- **Impact:** Database access layer, used by all permission/audit operations

### 2. **`infra/queue/JobQueueService.js`** (50 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +2-3%
- **Priority:** HIGH (Core async job processing)
- **Functions to test:**
  - Constructor with Redis connection setup
  - `enqueue()` - Job enqueueing with options
  - Worker processor and event handlers
  - Job completion/failure handling
  - Queue cleanup/shutdown
- **Impact:** Async operation backbone, used for heavy work and cron jobs

### 3. **`infra/ws/WsAdapter.js`** (57 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +2-3%
- **Priority:** HIGH (WebSocket communication)
- **Functions to test:**
  - Constructor initialization
  - `registerListeners()` - Message event handling
  - JSON parsing and command routing
  - Error handling and response sending
  - WebSocket reconnection logic
- **Impact:** WebSocket message handling, alternative command interface

### 4. **`infra/ws/WsClientFactory.js`** (36 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1-2%
- **Priority:** MEDIUM (WebSocket client creation)
- **Functions to test:**
  - Constructor with URL and options
  - `create()` - Client instantiation
  - Reconnection configuration
  - Custom options handling
  - Multiple client creation
- **Impact:** WebSocket client initialization and configuration

### 5. **`infra/di/container.js`** (63 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +2-3%
- **Priority:** HIGH (Dependency injection)
- **Functions to test:**
  - Dependency registration
  - Service resolution
  - Singleton/transient handling
  - Circular dependency detection
  - Error handling for missing dependencies
- **Impact:** Application bootstrap and service wiring

### 6. **`interfaces/http/BullBoardServer.js`** (27 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1-2%
- **Priority:** MEDIUM (Admin UI server)
- **Functions to test:**
  - Express app initialization
  - Bull Board router mounting
  - Queue registration
  - Port configuration
  - Server startup/shutdown
- **Impact:** Job queue admin interface

### 7. **`interfaces/http/HealthMetricsServer.js`** (35 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +2%
- **Priority:** MEDIUM (Health/metrics endpoints)
- **Functions to test:**
  - HTTP server creation
  - `/health` endpoint handling
  - `/metrics` endpoint handling
  - Status code handling (200, 503, 500)
  - Graceful shutdown
- **Impact:** Monitoring and diagnostics endpoints

### 8. **`infra/config/RedisConfig.js`** (18 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1%
- **Priority:** LOW (Configuration)
- **Functions to test:**
  - Redis connection configuration
  - Option validation
  - Connection string parsing
- **Impact:** Redis configuration initialization

### 9. **`infra/metrics/Metrics.js`** (21 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1%
- **Priority:** LOW (Metrics collection)
- **Functions to test:**
  - Metric recording
  - Histogram creation
  - Counter updates
  - Gauge modifications
- **Impact:** Application metrics and monitoring

### 10. **`infra/queue/Scheduler.js`** (19 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1%
- **Priority:** LOW (Job scheduling)
- **Functions to test:**
  - Scheduler initialization
  - Job scheduling logic
  - Cron pattern handling
  - Schedule cleanup
- **Impact:** Recurring job scheduling

---

## TIER 2: Partial Coverage Files (<50%)

These files have some tests but need significant expansion.

### 11. **`infra/discord/SlashCommandRegistrar.js`** (87 lines)
- **Current Coverage:** 11.62%
- **Estimated Gain:** +3-4%
- **Priority:** HIGH
- **Gap:** Only 9.8% statements covered, needs most methods tested
- **Functions to test:**
  - Command registration with Discord API
  - Bulk registration operations
  - Duplicate handling
  - Permission validation
  - Error handling for API failures

### 12. **`infra/discord/SlashCommandAdapter.js`** (183 lines)
- **Current Coverage:** 47.77%
- **Estimated Gain:** +1-2%
- **Priority:** MEDIUM (Already partially tested)
- **Gap:** Lines 15-24, 69, 83-85, 88-94, 96, 113-178 uncovered
- **Functions to test:**
  - Additional interaction types
  - Edge cases in option extraction
  - Modal submission handling
  - Autocomplete with all option types
  - Error scenarios

### 13. **`infra/discord/EmbedFactory.js`** (111 lines)
- **Current Coverage:** 39.28%
- **Estimated Gain:** +2-3%
- **Priority:** MEDIUM
- **Gap:** Lines 40-111 uncovered (majority of formatting logic)
- **Functions to test:**
  - All embed creation methods
  - Field formatting
  - Color handling
  - Pagination logic

### 14. **`infra/discord/DiscordClientFactory.js`** (20 lines)
- **Current Coverage:** 0%
- **Estimated Gain:** +1%
- **Priority:** LOW
- **Functions to test:**
  - Client initialization
  - Intents configuration
  - Connection error handling

---

## Recommended Build Order

Execute in this order to reach 70% coverage efficiently:

| Phase | File | Lines | Current | Estimated | Cumulative |
|-------|------|-------|---------|-----------|------------|
| 1️⃣ | **Repositories.js** | 124 | 0% | +5-6% | **52-53%** |
| 2️⃣ | **JobQueueService.js** | 50 | 0% | +2-3% | **55-56%** |
| 3️⃣ | **SlashCommandRegistrar.js** | 87 | 11.6% | +3-4% | **58-60%** |
| 4️⃣ | **WsAdapter.js** | 57 | 0% | +2-3% | **60-63%** |
| 5️⃣ | **container.js** | 63 | 0% | +2-3% | **63-66%** |
| 6️⃣ | **WsClientFactory.js** | 36 | 0% | +1-2% | **64-68%** |
| 7️⃣ | **SlashCommandAdapter.js** | 183 | 47.8% | +1-2% | **66-70%** ✓ |

**Files 8-14** (HealthMetricsServer, BullBoardServer, etc.) are secondary and can be done after reaching 70% for completeness.

---

## Testing Strategy

### For Tier 1 Files (0% coverage):
1. **Repositories.js** - Mock SQLite database, test all CRUD operations and error cases
2. **JobQueueService.js** - Mock BullMQ queue/worker/scheduler, test job lifecycle
3. **WsAdapter.js** - Mock WebSocket instance and message events
4. **container.js** - Mock service registration and dependency resolution
5. **SlashCommandRegistrar.js** - Mock Discord client and API responses

### Testing Patterns:
- Use Jest mocking for external dependencies (Redis, Discord, SQLite)
- Focus on happy path + error scenarios for each method
- Aim for 100% line coverage for critical files
- Test both synchronous and asynchronous operations
- Include integration-style tests for complex workflows

---

## Quick Reference: Uncovered Lines

**By Coverage Percentage (Lowest First):**
- 0% coverage: 10 files (Repositories, JobQueue, WsAdapter, WsFactory, DI, HealthMetrics, BullBoard, RedisConfig, Metrics, Scheduler)
- 11.6% coverage: SlashCommandRegistrar
- 35% coverage: Discord integration suite
- 39.3% coverage: EmbedFactory
- 47.8% coverage: SlashCommandAdapter

---

## Success Criteria

✅ **Phase 1 Complete when:**
- [ ] All 7 primary files tested
- [ ] Coverage reaches 70%+ overall
- [ ] All 351+ tests passing
- [ ] No test suite failures

---

## Notes

- **Database tests** require SQLite prepared statement mocking
- **Queue tests** require BullMQ Worker/Queue mocking
- **WebSocket tests** need event emitter patterns
- **DI container tests** should verify circular dependencies are caught
- **HTTP server tests** can use Node's built-in http module mocks

---

*Next Steps: Start with Repositories.js tests, aiming for 100% coverage of all 4 repository factories.*
