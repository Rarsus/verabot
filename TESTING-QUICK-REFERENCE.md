# Testing Quick Reference

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npm test -- PingHandler

# Run tests matching pattern
npm test -- --testNamePattern="should respond"
```

---

## Test File Locations

```
tests/
├── setup.js                                    # Global setup
├── fixtures/mocks.js                          # Mock helpers
├── unit/
│   ├── handlers/
│   │   └── core/
│   │       ├── PingHandler.test.js           (4 tests)
│   │       └── InfoHandler.test.js           (5 tests)
│   ├── services/
│   │   ├── CommandService.test.js            (8 tests)
│   │   └── PermissionService.test.js         (9 tests)
│   ├── middleware/
│   │   └── LoggingMiddleware.test.js         (10 tests)
│   └── commands/
│       └── CommandRegistry.test.js           (10 tests)
└── integration/
    └── CommandBus.test.js                    (1 test)
```

---

## Current Test Coverage

### Fully Tested (100%)
- PingHandler
- InfoHandler
- CommandService
- PermissionService
- LoggingMiddleware

### Partially Tested
- CommandRegistry (84%)

### Not Yet Tested
- HelpHandler
- StatsHandler
- UptimeHandler
- AllowHandler (and variants)
- PermissionMiddleware
- AuditMiddleware
- RateLimitMiddleware
- HelpService
- RateLimitService

---

## Writing New Tests

### Basic Test Template

```javascript
const MyClass = require('../../../src/path/to/MyClass');
const { createMockLogger } = require('../../fixtures/mocks');

describe('MyClass', () => {
  let instance;
  let mockDependency;

  beforeEach(() => {
    mockDependency = createMockLogger();
    instance = new MyClass(mockDependency);
  });

  describe('methodName', () => {
    it('should do something', async () => {
      const result = await instance.methodName('input');
      expect(result).toBe('expected');
    });

    it('should handle errors', async () => {
      mockDependency.someMethod.mockRejectedValue(new Error('test'));
      await expect(instance.methodName()).rejects.toThrow();
    });
  });
});
```

### Available Mocks

```javascript
const {
  createMockLogger,           // Logger with info, debug, warn, error
  createMockCommandResult,    // Command execution result
  createMockMiddleware,       // Middleware handler
  createMockRegistry,         // Command registry
  createMockPermissionService,// Permission checking
  createMockRateLimitService, // Rate limiting
  createMockCommandService,   // Command execution
  createMockHelpService       // Help documentation
} = require('../../fixtures/mocks');
```

---

## Test Statistics

**Current Status:**
- Tests: 48 / 48 passing ✅
- Coverage: 12.62% overall (improving)
- Test Suites: 8 / 8 passing ✅
- Execution Time: ~3.8 seconds

**Phase 1 Goal:** 70% coverage

---

## Coverage Thresholds

```javascript
// Global thresholds (must pass before commit)
- Statements: 70%
- Lines: 70%
- Functions: 70%
- Branches: 60%

// Handlers specifically (stricter)
- Statements: 80%
- Lines: 80%
- Functions: 80%
```

---

## Next Tests to Add

### Priority 1: Complete Handlers
- HelpHandler
- StatsHandler
- UptimeHandler

### Priority 2: Add Admin Handlers
- AllowHandler
- AllowChannelHandler
- AllowRoleHandler
- AllowUserHandler

### Priority 3: Add Services
- HelpService
- RateLimitService

### Priority 4: Add Remaining Middleware
- PermissionMiddleware
- AuditMiddleware
- RateLimitMiddleware

---

## Troubleshooting

### Test Fails with "Cannot find module"
Check the relative path from test file to source file:
- 3 `../` to go from `tests/unit/TYPE/` to `src/TYPE/`
- Example: `tests/unit/services/` → `../../../src/core/services/`

### Mock Not Working
Ensure mock is created before test:
```javascript
beforeEach(() => {
  mockLogger = createMockLogger();  // Must be inside beforeEach
});
```

### Coverage Not Improving
- Check if test actually exercises the code
- Use `console.log` to debug test execution
- Run `npm run test:coverage` to see uncovered lines

### Tests Running Slowly
- Check for unmocked async operations
- Look for real network calls or file I/O
- Ensure all mocks are synchronous

---

## Tips

1. **Use descriptive test names** - "should handle errors" vs "error handling"
2. **Test both happy and sad paths** - Success AND failure cases
3. **Mock all dependencies** - Don't rely on real services
4. **Use beforeEach** - Fresh mocks for each test
5. **Keep tests focused** - One concept per test
6. **Test edge cases** - Empty arrays, null values, etc.

---

## CI/CD Integration

These tests will eventually run:
- On every commit (pre-commit hook)
- On every push (GitHub Actions)
- On pull requests (status check)
- On schedule (weekly security tests)

The goal is to prevent bad code from reaching production!

---

**Last Updated:** December 21, 2025  
**Tests Passing:** 48/48 ✅  
**Ready for Phase 2:** Yes ✅
