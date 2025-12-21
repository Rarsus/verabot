# 16. Coverage Strategy

Reaching 70% code coverage - Phase 1 roadmap.

---

## Current Status

- **Coverage:** 47.57% statements
- **Target:** 70% coverage
- **Gap:** +22.43 points
- **Baseline:** 351 passing tests

---

## Phase 1: Infrastructure Tests (Target: 70%)

### Priority Build Order

1. **Repositories.js** (40+ tests)
   - Database CRUD operations
   - Query building
   - Error handling

2. **JobQueueService.js** (25 tests)
   - Job enqueueing
   - Job processing
   - Error recovery

3. **SlashCommandRegistrar.js** (28 tests)
   - Registering commands
   - Updating existing commands
   - Error handling

4. **WsAdapter.js** (14 tests)
   - Message parsing
   - Event handling
   - Connection lifecycle

5. **DIContainer.js** (20 tests)
   - Dependency registration
   - Dependency resolution
   - Circular dependencies

6. **WsClientFactory.js** (18 tests)
   - Factory creation
   - Configuration
   - Error states

7. **SlashCommandAdapter.js** (14 tests)
   - Command execution
   - Option parsing
   - Error responses

---

## Phase 2: Additional Coverage (Target: 85%)

- HTTP servers (BullBoardServer, HealthMetricsServer)
- Redis integration
- Additional handler coverage

---

## Phase 3: Perfect Coverage (Target: 100%)

- Edge cases
- Error scenarios
- Performance tests

---

## Running Coverage Reports

```bash
npm test -- --coverage

# Detailed report
npm test -- --coverage --verbose
```

---

**Previous:** [Testing](./15-TESTING.md) | **Next:** [Test Examples](./17-TEST-EXAMPLES.md)
