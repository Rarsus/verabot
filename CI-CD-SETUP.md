# GitHub Workflows Quick Reference

## Workflow Files Created

```
.github/
├── workflows/
│   ├── ci.yml                 # Main CI pipeline
│   ├── code-quality.yml       # Code quality analysis
│   ├── dependency-check.yml   # Dependency monitoring
│   ├── pr-quality-gate.yml    # PR validation
│   └── release.yml            # Release automation
└── WORKFLOWS.md               # Detailed documentation
```

## Workflow Summary

| Workflow             | Trigger                                 | Jobs                         | Purpose                   |
| -------------------- | --------------------------------------- | ---------------------------- | ------------------------- |
| **CI**               | Push/PR on main,develop; Daily 2 AM UTC | Lint, Test, Security         | Main quality gate         |
| **Code Quality**     | Push/PR on main,develop                 | Coverage, Format, Complexity | Code metrics analysis     |
| **Dependency Check** | Weekly Monday 9 AM UTC                  | Check Outdated Deps          | Monitor for updates       |
| **PR Quality Gate**  | PR opened/updated                       | Validate PR                  | Comprehensive PR checks   |
| **Release**          | Tag v\* or push to main                 | Build, Publish               | npm publishing & releases |

## Key Features

✅ **Node.js v24** via `.nvmrc` (consistent across all workflows)
✅ **Daily Security Audits** at 2 AM UTC
✅ **Weekly Dependency Checks** on Mondays
✅ **Code Coverage Reporting** to Codecov
✅ **Automated npm Publishing** on version tags
✅ **PR Quality Comments** with helpful guidance
✅ **Conventional Commit Validation**
✅ **GitHub Release Creation** for tagged releases

## Setup Instructions

### 1. Enable GitHub Actions

- Repository is ready to use (no additional setup needed)
- Workflows will run automatically on push/PR

### 2. Configure npm Publishing (Optional)

For **Release Workflow** to publish to npm:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Your npm authentication token from `npm token create` (public)

### 3. Configure Codecov (Optional)

For code coverage reporting:

1. Go to https://codecov.io
2. Connect your GitHub repository
3. Codecov will automatically pick up coverage from workflows

## Running Locally

### Test Workflows with `act`

```bash
# Install act
brew install act  # macOS
# or use your system package manager

# Run a specific workflow
act -j lint

# Run all jobs
act

# Simulate pull request
act pull_request
```

## Monitoring Workflows

1. Go to **Actions** tab in your repository
2. Select a workflow to view history
3. Click a specific run to see job logs
4. Failed jobs show detailed error messages

## Common Tasks

### Trigger Dependency Check Manually

```
Go to: Actions → Dependency Check → Run workflow
```

### Fix Linting Issues

```bash
npm run lint:fix
```

### Test Locally Before Pushing

```bash
npm test
npm run lint
npm audit --production
```

### Creating a Release

```bash
# Tag a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Workflow automatically:
# - Runs all tests
# - Publishes to npm (if NPM_TOKEN set)
# - Creates GitHub release
```

## Workflow Details

### CI Workflow (ci.yml)

**When:** Every push and PR, plus daily at 2 AM UTC

- Linting with ESLint
- Full test suite with coverage
- npm audit on production deps
- Codecov upload

### Code Quality Workflow (code-quality.yml)

**When:** Every push and PR

- Coverage analysis (minimum 90%)
- Code formatting check with Prettier
- Complexity analysis

### Dependency Check (dependency-check.yml)

**When:** Weekly Mondays at 9 AM UTC

- Checks for outdated packages
- Security vulnerability scan
- Creates GitHub issue if problems found

### PR Quality Gate (pr-quality-gate.yml)

**When:** PR opened/updated on main/develop

- Full linting and testing
- Security audit
- Commit message validation
- Helpful PR comment

### Release Workflow (release.yml)

**When:** Tag pushed (v\*) or push to main

- Builds and verifies code
- Publishes to npm registry
- Creates GitHub release
- Requires NPM_TOKEN secret

## Troubleshooting

| Issue                | Solution                            |
| -------------------- | ----------------------------------- |
| Lint failures        | Run `npm run lint:fix`              |
| Test failures        | Run `npm test` locally to debug     |
| Coverage below 90%   | Increase test coverage for new code |
| npm publish fails    | Verify NPM_TOKEN secret is set      |
| Workflow not running | Check branch protection rules       |

## Next Steps

1. Push this commit to trigger first CI run
2. Watch the **Actions** tab for workflow execution
3. Set NPM_TOKEN secret if you plan to publish
4. Create a pull request to test PR quality gate
5. Tag a release to test publishing workflow

## Documentation

Full workflow documentation: [.github/WORKFLOWS.md](.github/WORKFLOWS.md)

## Questions?

Refer to:

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Workflow syntax reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [.github/WORKFLOWS.md](.github/WORKFLOWS.md)
