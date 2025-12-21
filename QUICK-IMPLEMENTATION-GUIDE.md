# VeraBot: Quick Implementation Guide

This guide provides step-by-step instructions to implement CI/CD and TDD on the verabot repository.

## Table of Contents

1. [Phase 1: Testing Foundation](#phase-1-testing-foundation)
2. [Phase 2: Code Quality & Linting](#phase-2-code-quality--linting)
3. [Phase 3: CI/CD Pipeline](#phase-3-cicd-pipeline)
4. [Phase 4: Documentation](#phase-4-documentation)

---

## Phase 1: Testing Foundation

### Step 1.1: Install Test Dependencies

```bash
npm install --save-dev jest-mock-extended
```

### Step 1.2: Create Test Structure

```bash
# Create directories
mkdir -p tests/unit/handlers/core
mkdir -p tests/unit/handlers/admin
mkdir -p tests/unit/services
mkdir -p tests/unit/middleware
mkdir -p tests/fixtures
```

**`tests/setup.js`:**

```javascript
// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});
```

### Step 1.3: Create Mock Helpers

**`tests/fixtures/mocks.js`:**

```javascript
// Mock logger
const createMockLogger = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Mock command result
const createMockCommandResult = (data = {}, success = true) => ({
  success,
  data,
  error: success ? null : new Error('Command failed'),
  timestamp: new Date().toISOString(),
});

// Mock registry
const createMockRegistry = (handlers = {}) => ({
  get: jest.fn((name) => handlers[name] || null),
  register: jest.fn(),
  getAll: jest.fn(() => Object.values(handlers)),
  has: jest.fn((name) => name in handlers),
});

module.exports = {
  createMockLogger,
  createMockCommandResult,
  createMockRegistry,
};
```

### Step 1.4: Update Jest Configuration

**`jest.config.js`:**

```javascript
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
      functions: 70,
      branches: 60,
    },
    './src/app/handlers/': {
      lines: 80,
      statements: 80,
      functions: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
```

### Step 1.5: Update package.json Scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit"
  }
}
```

---

## Phase 2: Code Quality & Linting

### Step 2.1: Install ESLint & Prettier

```bash
npm install --save-dev \
  eslint \
  prettier \
  eslint-config-prettier \
  eslint-plugin-jest \
  @eslint/js \
  husky \
  lint-staged
```

### Step 2.2: Create ESLint Configuration

**`.eslintrc.json`:**

```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

### Step 2.3: Create Prettier Configuration

**`.prettierrc.json`:**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Step 2.4: Setup Husky

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Step 2.5: Create Lint-staged Configuration

**`.lintstagedrc.json`:**

```json
{
  "*.js": ["eslint --fix", "prettier --write"],
  "*.json": ["prettier --write"]
}
```

### Step 2.6: Add Quality Scripts

```json
{
  "scripts": {
    "lint": "eslint src tests",
    "lint:fix": "eslint --fix src tests",
    "format": "prettier --write \"src/**/*.js\" \"tests/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\" \"tests/**/*.js\""
  }
}
```

---

## Phase 3: CI/CD Pipeline

### Step 3.1: Create GitHub Actions Directory

```bash
mkdir -p .github/workflows
```

### Step 3.2: Create Test Workflow

**`.github/workflows/test.yml`:**

```yaml
name: Test & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
```

### Step 3.3: Create Code Quality Workflow

**`.github/workflows/quality.yml`:**

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
```

### Step 3.4: Create Security Workflow

**`.github/workflows/security.yml`:**

```yaml
name: Security

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
```

### Step 3.5: Create Dependabot Configuration

**`.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: '/'
    schedule:
      interval: weekly
```

---

## Phase 4: Documentation

### Step 4.1: Create Testing Documentation

**`docs/TESTING.md`:**

```markdown
# Testing Guide

## Running Tests

\`\`\`bash
npm test # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage
\`\`\`

## Writing Tests

Test structure:
\`\`\`javascript
describe('ComponentName', () => {
let component;

beforeEach(() => {
component = new Component();
});

it('should do something', () => {
expect(component.method()).toBe('result');
});
});
\`\`\`

## Coverage Requirements

- Lines: 70%+
- Statements: 70%+
- Functions: 70%+
- Branches: 60%+
```

### Step 4.2: Create CI/CD Documentation

**`docs/CI-CD.md`:**

```markdown
# CI/CD Pipeline

## Workflows

- **Test & Coverage** - Runs tests on push/PR
- **Code Quality** - Linting and formatting
- **Security** - Dependency audit

## Branch Protection

Main branch requires:

- All status checks passing
- Code review approval
- Branches up to date

## Making Changes

1. Create feature branch
2. Push changes
3. Workflows run automatically
4. Fix any failures
5. Create PR
6. Get approval
7. Merge
```

### Step 4.3: Create Contributing Guide

**`CONTRIBUTING.md`:**

```markdown
# Contributing

## Setup

\`\`\`bash
git clone <repo>
cd verabot
npm install
\`\`\`

## Workflow

1. Create feature branch
2. Make changes
3. Run \`npm run quality\`
4. Push and create PR
5. Address reviews
6. Merge when approved

## Standards

- Tests required (70%+ coverage)
- ESLint passing
- Prettier formatting
- Code review approval
```

---

## Verification Checklist

- [ ] Jest configured with coverage
- [ ] Test files created for handlers
- [ ] ESLint and Prettier configured
- [ ] Pre-commit hooks working
- [ ] GitHub Actions workflows created
- [ ] Dependabot configured
- [ ] Branch protection enabled
- [ ] Documentation created

## Success Metrics

| Metric            | Target | Current |
| ----------------- | ------ | ------- |
| Test Coverage     | 70%+   | ~0.4%   |
| ESLint Errors     | 0      | TBD     |
| Workflows Passing | 100%   | 0%      |

## Next Steps

1. Implement Phase 1 testing
2. Add Phase 2 code quality
3. Create Phase 3 CI/CD workflows
4. Add Phase 4 documentation
5. Gradually increase coverage to 85%+
