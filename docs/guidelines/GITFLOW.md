# 🌿 Gitflow Workflow Guide

This document describes the branching strategy and workflow for the VeraBot project.

## 📋 Table of Contents

1. [Branch Structure](#branch-structure)
2. [Branch Naming](#branch-naming)
3. [Workflow Processes](#workflow-processes)
4. [Commit Conventions](#commit-conventions)
5. [Code Review Process](#code-review-process)
6. [Merging Strategy](#merging-strategy)
7. [Release Process](#release-process)
8. [Hotfix Process](#hotfix-process)

---

## 🌳 Branch Structure

### Main Branches

#### `main`

- **Purpose**: Production-ready code
- **Stability**: Most stable, always deployable
- **Protection**: Requires PR reviews and status checks
- **Merge From**: `release/*` and `hotfix/*` branches only
- **Merge To**: Never directly commit
- **Tagged**: All releases tagged with semantic version (v1.0.0)

#### `develop`

- **Purpose**: Integration branch for next release
- **Stability**: Stable, passed all tests
- **Protection**: Requires status checks (tests/lint)
- **Merge From**: `feature/*` and `bugfix/*` branches
- **Merge To**: Main (via release branch)
- **Release Point**: Starting point for release branches

### Supporting Branches

#### `feature/*`

- **Purpose**: New features and enhancements
- **Naming**: `feature/feature-name` (e.g., `feature/webhook-proxy`)
- **Created From**: `develop`
- **Merged Back To**: `develop`
- **Deletion**: Delete after merge
- **Lifetime**: Short-lived (days to weeks)

**Example:**

```bash
git checkout -b feature/add-slash-commands develop
```

#### `bugfix/*`

- **Purpose**: Bug fixes for next release
- **Naming**: `bugfix/bug-description` (e.g., `bugfix/rate-limit-edge-case`)
- **Created From**: `develop`
- **Merged Back To**: `develop`
- **Deletion**: Delete after merge
- **Lifetime**: Short-lived (days)

**Example:**

```bash
git checkout -b bugfix/fix-permission-check develop
```

#### `release/*`

- **Purpose**: Release preparation and versioning
- **Naming**: `release/v1.2.0` (semantic version)
- **Created From**: `develop`
- **Merged Back To**: `main` and `develop`
- **Deletion**: Delete after merge
- **Lifetime**: Short-lived (release window)
- **Allowed Changes**: Version bumps, changelog, bug fixes only

**Example:**

```bash
git checkout -b release/v1.2.0 develop
# Update version in package.json
# Update CHANGELOG.md
# Push and create PR to main
```

#### `hotfix/*`

- **Purpose**: Critical production fixes
- **Naming**: `hotfix/critical-bug-name` (e.g., `hotfix/security-vulnerability`)
- **Created From**: `main`
- **Merged Back To**: `main` and `develop`
- **Deletion**: Delete after merge
- **Lifetime**: Very short-lived (hours to days)
- **Bypass**: Can bypass normal review process if critical

**Example:**

```bash
git checkout -b hotfix/critical-security-fix main
# Fix the issue
# Create PR to main
# Merge to both main and develop
```

---

## 📛 Branch Naming Conventions

### Format

```
<type>/<scope>-<description>

type:        feature, bugfix, release, hotfix
scope:       component or domain (optional for simple names)
description: kebab-case, descriptive, max 50 chars
```

### Examples

✅ **Good**

```
feature/webhook-proxy
feature/slash-commands
bugfix/rate-limit-edge-case
bugfix/permission-check
hotfix/security-vulnerability
release/v1.2.0
```

❌ **Bad**

```
feature/my-changes
bugfix/fix1
feature/this-is-a-very-long-branch-name-that-exceeds-limits
new_feature
bug_fix
```

---

## 🔄 Workflow Processes

### Feature Development Workflow

```
1. Create feature branch from develop
   git checkout -b feature/new-feature develop

2. Implement feature locally
   git commit -m "feat(scope): description"
   git commit -m "test(scope): add tests for new-feature"

3. Push and create Pull Request to develop
   git push -u origin feature/new-feature

4. Code review (minimum 1 reviewer)
   - Fix review comments
   - Push updates
   - Request review again

5. Merge with "Squash and Merge" strategy
   - Merges all commits into one
   - Deletes feature branch

6. Delete local branch
   git branch -d feature/new-feature
```

### Bugfix Development Workflow

Similar to feature workflow:

```
git checkout -b bugfix/bug-name develop
# Fix the bug
git commit -m "fix(scope): description"
git push -u origin bugfix/bug-name
# Create PR, review, merge
```

### Release Workflow

```
1. Create release branch from develop
   git checkout -b release/v1.2.0 develop

2. Prepare release
   - Update package.json version
   - Update CHANGELOG.md
   - Add release notes

   git commit -m "chore(release): v1.2.0"

3. Create PR to main
   - Review changes
   - Ensure all tests pass

4. Merge to main with "Create Merge Commit"
   - Creates merge commit
   - Creates GitHub release
   - Tags with version

5. Merge back to develop
   - Cherry-pick release commit to develop
   - Or merge release branch to develop

6. Delete release branch
```

### Hotfix Workflow

```
1. Create hotfix from main immediately
   git checkout -b hotfix/critical-bug main

2. Fix the critical issue
   git commit -m "fix(scope): critical bug description"

3. Create PR to main
   - Expedited review (can be 1 reviewer)
   - All tests must pass

4. Merge to main with "Create Merge Commit"
   - Creates release tag
   - Triggers release process

5. Merge/cherry-pick to develop
   - Ensure develop gets the fix

6. Delete hotfix branch
```

---

## 💬 Commit Conventions

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, tooling, etc.
- **ci**: Changes to CI/CD configuration
- **revert**: Reverting a previous commit

### Scope

The scope is optional but highly recommended. Common scopes:

- **discord**: Discord.js integration
- **database**: Database operations
- **middleware**: Middleware components
- **command**: Command handlers
- **test**: Test files
- **build**: Build/tooling
- **release**: Version/release related

### Subject

- Imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters

### Body

- Optional but recommended for non-trivial changes
- Explain **what** and **why**, not how
- Wrap at 72 characters
- Separate from subject with blank line

### Footer

Use for:

- Breaking changes: `BREAKING CHANGE: description`
- Closing issues: `Closes #123`, `Fixes #456`

### Examples

✅ **Good Commits**

```
feat(discord): add slash command support

Implement Discord.js slash command integration for better
UX. Commands now support autocomplete and ephemeral responses.

Closes #123
```

```
fix(middleware): prevent rate limit race condition

Add atomic check-and-set operation to rate limit middleware
to prevent concurrent requests bypassing limits.

Fixes #456
```

```
docs: update README installation instructions
```

```
chore(deps): upgrade discord.js to v14.11.0

BREAKING CHANGE: Intents API changed, update client initialization
```

---

## 👀 Code Review Process

### Before Creating PR

- [ ] Tests pass locally: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting passes: `npm run format:check`
- [ ] Code coverage maintained (>85%)
- [ ] Branch is up-to-date with base branch
- [ ] Commits follow conventional commits format

### PR Requirements

- [ ] Clear description of changes
- [ ] Link to related issues
- [ ] Screenshots (if UI changes)
- [ ] Tests added/updated
- [ ] Documentation updated

### Reviewer Responsibilities

- [ ] Code quality and maintainability
- [ ] Test coverage adequacy
- [ ] Security implications
- [ ] Performance impact
- [ ] API compatibility
- [ ] Documentation clarity

### Approval Criteria

- Minimum 1 approval for `develop`
- Minimum 1 approval for `main` (usually release/hotfix)
- All conversations resolved
- All status checks passing
- Branch up-to-date with base

### Review Feedback

- ✅ **Approved**: Ready to merge
- 💬 **Comment**: Informational, no action needed
- ⚠️ **Request Changes**: Must address before approval

---

## 🔀 Merging Strategy

### Feature → Develop

- **Strategy**: Squash and Merge
- **Reason**: Keeps develop history clean
- **Result**: One commit per feature
- **Delete**: Yes (automatic)

### Release → Main

- **Strategy**: Create a Merge Commit
- **Reason**: Preserves release history
- **Result**: Merge commit with all changes
- **Delete**: Yes (after merge)
- **Tag**: Automatic with version tag

### Hotfix → Main

- **Strategy**: Create a Merge Commit
- **Reason**: Critical fix history preservation
- **Result**: Merge commit
- **Delete**: Yes (after merge)
- **Tag**: Automatic with patch version tag

### Any Branch → Develop

- **Strategy**: Squash and Merge (default)
- **Result**: Clean history
- **Delete**: Yes (automatic)

### Merge Back to Develop

- After merging release or hotfix to main
- **Strategy**: Create a Merge Commit (preserves history)
- **Reason**: Documents release point in develop

---

## 🚀 Release Process

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major features
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Checklist

```
1. Create release branch
   git checkout -b release/vX.Y.Z develop

2. Update version in package.json
   npm version minor  # or major/patch as needed

3. Update CHANGELOG.md
   - Add version date
   - List new features
   - List bug fixes
   - List breaking changes

4. Commit changes
   git commit -am "chore(release): vX.Y.Z"

5. Create PR to main
   - Description: Release summary
   - Link to milestone (if applicable)

6. Get approval

7. Merge to main with merge commit
   - Creates GitHub release
   - Tags with version

8. Merge/cherry-pick to develop
   - Keeps develop synced

9. Delete release branch

10. Verify release
    - npm package published
    - GitHub release created
    - Tag present
```

---

## 🔥 Hotfix Process

### When to Use Hotfix

- Critical security vulnerabilities
- Production outages
- Data-loss bugs
- Cannot wait for next release

### Hotfix Checklist

```
1. Create hotfix from main
   git checkout -b hotfix/description main

2. Fix the issue
   - Minimal changes only
   - Add regression test

3. Commit with fix message
   git commit -m "fix(scope): critical issue"

4. Create PR to main
   - Urgent tag
   - Clear impact description
   - Include workaround if available

5. Expedited review (can be 1 approver)
   - Focus on fix correctness
   - No scope creep

6. Merge to main
   - Creates patch version tag automatically

7. Cherry-pick to develop
   - Ensure develop gets fix too
   - May need conflict resolution

8. Delete hotfix branch

9. Monitor production
```

---

## 📊 Branch Status Commands

### View All Branches

```bash
# Local branches
git branch

# Remote branches
git branch -r

# All branches
git branch -a
```

### View Branch Status

```bash
# What changes are in develop but not in main
git log main..develop

# What changes are in main but not in develop
git log develop..main

# Branch comparison
git diff main develop
```

### Cleanup Old Branches

```bash
# Delete local branches
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Clean up deleted remote branches
git fetch -p
```

---

## ⚠️ Common Issues & Solutions

### Issue: Feature branch too far behind develop

**Solution:**

```bash
git fetch origin
git rebase origin/develop
# Or if you prefer merge
git merge origin/develop
```

### Issue: Accidental commit to wrong branch

**Solution:**

```bash
git log  # Find commit hash
git reset --soft HEAD~1  # Undo last commit, keep changes
git stash  # Save changes
git checkout correct-branch
git stash pop  # Apply changes
git commit -m "feat: message"
```

### Issue: Need to cherry-pick a commit

**Solution:**

```bash
git checkout target-branch
git cherry-pick <commit-hash>
# Resolve conflicts if any
git cherry-pick --continue
```

### Issue: Merge conflict

**Solution:**

```bash
git status  # See conflicting files
# Edit files and resolve conflicts
git add resolved-file
git commit -m "merge: resolve conflicts from feature/branch"
```

---

## 🔐 Branch Protection Rules

The following are enforced on `main` and `develop`:

### Main Branch

- ✅ Require pull request reviews (1 minimum)
- ✅ Require status checks to pass:
  - ESLint
  - Tests
  - Code coverage (85%+)
  - PR Quality Gate
- ✅ Require branches to be up-to-date
- ✅ Restrict who can push (maintainers only)
- ✅ Allow force pushes: No
- ✅ Allow deletions: No

### Develop Branch

- ✅ Require status checks to pass:
  - ESLint
  - Tests
- ✅ Require branches to be up-to-date
- ✅ Allow force pushes: No
- ✅ Allow deletions: No

**For detailed configuration instructions**, see the [Branch Protection Setup Guide](../ci-cd/BRANCH_PROTECTION.md).

---

## 📚 Additional Resources

- [Branch Protection Setup Guide](../ci-cd/BRANCH_PROTECTION.md) - Detailed GitHub branch protection configuration
- [GitHub Workflows Documentation](../../.github/WORKFLOWS.md) - CI/CD pipeline and workflow details
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to the project
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

---

## 💡 Best Practices

1. **Small PRs**: Keep PRs focused and reviewable (<500 lines if possible)
2. **Frequent Commits**: Commit often with clear messages
3. **Keep Branch Updated**: Rebase/merge develop regularly
4. **Test Locally**: Run full test suite before pushing
5. **Write Tests**: All new code should have tests
6. **Document Changes**: Update docs for API changes
7. **Code Review**: Take feedback constructively
8. **Communicate**: Ask questions if unclear

---

**Last Updated**: December 2025
**Maintainer**: @Rarsus
