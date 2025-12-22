# GitHub Workflows Documentation

This project uses GitHub Actions for continuous integration, testing, security auditing, and release management.

## Workflows Overview

### 1. **CI Workflow** (`ci.yml`)

Main continuous integration workflow that runs on every push and pull request.

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily schedule at 2 AM UTC (security audit only)

**Jobs:**

- **Lint**: Runs ESLint to check code quality
- **Test**: Runs full test suite with coverage reporting
- **Security**: Performs npm audit on production dependencies

**Timeout:** 10-15 minutes

### 2. **Code Quality Workflow** (`code-quality.yml`)

Analyzes code coverage, formatting, and complexity.

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

- **Coverage**: Analyzes test coverage and comments on PRs
- **Format**: Checks code formatting with Prettier
- **Complexity**: Checks for overly complex code patterns

**Timeout:** 10-15 minutes

### 3. **Dependency Check Workflow** (`dependency-check.yml`)

Monitors dependencies for outdated versions and security issues.

**Triggers:**

- Weekly schedule (Mondays at 9 AM UTC)
- Manual workflow dispatch

**Jobs:**

- **Check Dependencies**: Identifies outdated packages and creates issues

**Timeout:** 10 minutes

### 4. **PR Quality Gate Workflow** (`pr-quality-gate.yml`)

Comprehensive quality validation for pull requests.

**Triggers:**

- Pull request opened, synchronized, or reopened on `main` or `develop`

**Jobs:**

- **Validate PR**: Runs linting, tests, security audit, and validates commit messages
- **Comment on PR**: Adds helpful comment on newly opened PRs

**Requirements:**

- All tests must pass
- ESLint must pass without violations
- npm audit must pass (no moderate/high/critical vulnerabilities)

**Timeout:** 20 minutes

### 5. **Release Workflow** (`release.yml`)

Handles building and publishing releases to npm.

**Triggers:**

- Push to tags matching `v*` pattern
- Push to `main` branch

**Jobs:**

- **Build**: Verifies code quality before release
- **Publish**: Publishes to npm registry and creates GitHub releases

**Requirements:**

- `NPM_TOKEN` secret must be set in repository settings
- Tests must pass
- Linting must pass

**Timeout:** 10-15 minutes

## Configuration

### Environment Variables

All workflows use the Node.js version specified in `.nvmrc` (currently v24).

### Required Secrets

For the **Release Workflow** to work, you need to set:

1. **NPM_TOKEN**
   - Go to: Settings → Secrets and variables → Actions
   - Create new repository secret
   - Name: `NPM_TOKEN`
   - Value: Your npm authentication token

### Node.js Version

The workflows use `.nvmrc` to specify the Node.js version. This ensures consistency across all CI jobs.

```bash
# View current version
cat .nvmrc
```

## Running Workflows Locally

You can test workflows locally using `act` (GitHub Actions emulator):

```bash
# Install act (https://github.com/nektos/act)
brew install act  # or your OS's package manager

# Run a specific workflow
act -j lint

# Run all workflows for a specific event
act push
```

## Workflow Status

View workflow status and logs:

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select a workflow to view runs
4. Click a specific run to see job logs

## Troubleshooting

### Lint Failures

```bash
# Fix linting errors locally
npm run lint:fix
```

### Test Failures

```bash
# Run tests locally to debug
npm test

# Run tests in watch mode
npm test:watch
```

### Coverage Below Threshold

- The coverage threshold is 90%
- Run `npm test -- --coverage` to see detailed coverage report
- Fix uncovered code paths before submitting PR

### Security Audit Failures

```bash
# Check for vulnerabilities locally
npm audit

# Audit production dependencies only
npm audit --production

# Fix vulnerabilities (if available)
npm audit fix
```

## Best Practices

1. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `chore:` for maintenance

2. **Pull Requests**:
   - Keep PRs focused on a single issue
   - Write clear descriptions
   - Ensure all CI checks pass
   - Request reviews before merging
   - Follow branch protection rules (see [Branch Protection Guide](../docs/ci-cd/BRANCH_PROTECTION.md))

3. **Testing**:
   - Write tests for new features
   - Maintain or increase coverage
   - Run full test suite locally before pushing

4. **Dependencies**:
   - Keep dependencies updated
   - Review security advisories
   - Use `npm audit fix` for automatic fixes
   - Test thoroughly after major updates

5. **Branching**:
   - Follow the [GitFlow workflow](../docs/guidelines/GITFLOW.md)
   - Create feature branches from `develop`
   - Merge to `main` only through release branches

## Monitoring

- **Weekly**: Dependency check runs every Monday
- **Daily**: Security audit runs daily at 2 AM UTC
- **Per-commit**: All other workflows run on every push/PR

Check the Actions tab regularly to ensure workflows are passing.

## Future Enhancements

Potential workflow improvements:

- [ ] Docker image building and pushing
- [ ] Automated dependency updates (Dependabot integration)
- [ ] Performance benchmarking
- [ ] API documentation generation
- [ ] Staging environment deployment
- [ ] Slack/Discord notifications for failures
- [ ] Automatic changelog generation
- [ ] Code coverage badge updates

## Related Documentation

- [Branch Protection Rules](../docs/ci-cd/BRANCH_PROTECTION.md) - Detailed guide on configuring GitHub branch protection
- [CI/CD Setup Guide](../docs/ci-cd/CI-CD-SETUP.md) - Complete CI/CD configuration instructions
- [GitFlow Workflow](../docs/guidelines/GITFLOW.md) - Branching strategy and development workflow
- [Contributing Guide](../docs/guidelines/CONTRIBUTING.md) - How to contribute to the project
