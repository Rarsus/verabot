# 🤝 Contributing to VeraBot

First off, thank you for considering contributing to VeraBot! It's people like you that make VeraBot such a great tool.

## 📋 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to @Rarsus.

## ❓ How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, Node version, Discord.js version)

### ✨ Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and the expected new behavior**
- **Explain why this enhancement would be useful**

### 🔨 Pull Requests

- Fill in the required PR template
- Follow the [GITFLOW.md](./GITFLOW.md) guide
- Follow the JavaScript style guide (enforced by ESLint/Prettier)
- Include appropriate test cases
- Update documentation as needed
- End all files with a newline

## 🎨 Development Setup

### Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- Git

### Local Development

1. **Fork the repository** on GitHub

2. **Clone your fork locally:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/verabot.git
   cd verabot
   ```

3. **Add upstream remote:**

   ```bash
   git remote add upstream https://github.com/Rarsus/verabot.git
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name develop
   ```

6. **Make your changes** and commit them:

   ```bash
   git commit -m "feat(scope): your message"
   ```

7. **Keep your branch updated:**

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

8. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request** from your fork to the upstream repository

## 🧪 Testing

All contributions must include appropriate tests.

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.js

# Run tests in watch mode
npm test -- --watch
```

### Coverage Requirements

- Minimum 80% line coverage for new code
- All new functions/methods should have tests
- All bug fixes should include regression tests

## 📝 Coding Standards

### Code Style

This project uses **ESLint** and **Prettier** to enforce consistent code style.

```bash
# Check linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check formatting
npm run format:check

# Format code automatically
npm run format
```

### Naming Conventions

- **Variables**: `camelCase` (e.g., `userId`, `quoteText`)
- **Classes**: `PascalCase` (e.g., `CommandHandler`, `MessageService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Files**: `kebab-case` (e.g., `message-handler.js`, `discord-client.js`)
- **Branches**: `type/description` (e.g., `feature/webhook-support`)
- **Commits**: Conventional commits format

### JSDoc Comments

All functions and classes should have JSDoc comments:

```javascript
/**
 * Fetches a user by ID from the database
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<User>} The user object
 * @throws {DatabaseError} If the query fails
 * @example
 * const user = await getUserById('123');
 */
async function getUserById(userId) {
  // implementation
}
```

### Import/Require Organization

1. Node.js built-ins
2. External packages
3. Local modules
4. Empty line between each group

```javascript
const path = require('path');
const fs = require('fs');

const discord = require('discord.js');
const axios = require('axios');

const { CommandBase } = require('./command-base');
const { DatabaseService } = require('./services');
```

## 📚 Documentation

- Update README.md if changing user-facing features
- Update GITFLOW.md if changing development process
- Update JSDoc comments for API changes
- Include code examples for complex features
- Update type definitions/comments if used

## 🔄 Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
type(scope): subject

body

footer
```

### Examples

```
feat(discord): add slash command support

Implement Discord.js slash command integration with autocomplete
and ephemeral responses. Maintains backward compatibility with
prefix commands.

Closes #456
```

```
fix(middleware): prevent rate limit race condition

Replace async operations with atomic database operations to
prevent concurrent requests from bypassing rate limits.

Fixes #789
```

```
docs: update installation instructions
```

```
refactor(services): simplify database operations

Extract common patterns into reusable helper functions.
No behavioral changes.
```

## ✅ Checklist for PRs

Before submitting a PR, ensure:

- [ ] Code follows style guidelines (`npm run lint` passes)
- [ ] Code is formatted properly (`npm run format:check` passes)
- [ ] All tests pass (`npm test` passes)
- [ ] Coverage threshold met (>80%)
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] PR title follows conventional format
- [ ] No console.log statements left in code
- [ ] No commented-out code left in PR
- [ ] Branch is up-to-date with develop

## 🚀 Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
   - Linting: ESLint
   - Formatting: Prettier
   - Tests: Full suite with coverage
   - Security: npm audit

2. **Code Review**: At least 1 human review required
   - Code quality and readability
   - Functionality and correctness
   - Test coverage adequacy
   - Documentation completeness

3. **Merge**: Squash and merge to develop
   - Keeps history clean
   - Preserves PR context

## 🔓 License

By contributing to VeraBot, you agree that your contributions will be licensed under its license.

## 📞 Get Help

- **Questions?** Open a GitHub Discussion
- **Security Issue?** Email @Rarsus privately
- **General Help?** Check existing issues and documentation

## 📚 Related Documentation

- [GitFlow Workflow Guide](./GITFLOW.md) - Detailed branching strategy
- [Branch Protection Rules](../ci-cd/BRANCH_PROTECTION.md) - GitHub repository protection setup
- [GitHub Workflows](../../.github/WORKFLOWS.md) - CI/CD pipeline documentation
- [Testing Guide](../15-TESTING.md) - How to write and run tests

## 🙏 Thank You!

Your contributions are what make this project great. Thank you for taking the time to contribute!

---

**Happy coding! 🎉**
