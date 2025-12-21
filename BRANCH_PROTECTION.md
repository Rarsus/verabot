# 🔐 Branch Protection & GitHub Settings

This document describes the recommended branch protection rules and GitHub settings for the VeraBot project.

## 📋 Quick Setup Checklist

- [ ] Configure main branch protection rules
- [ ] Configure develop branch protection rules
- [ ] Set required reviewers
- [ ] Configure auto-delete head branches
- [ ] Set up branch naming restrictions
- [ ] Configure CODEOWNERS
- [ ] Enable required status checks

---

## 🛡️ Main Branch Protection Rules

**Path**: Settings → Branches → Branch protection rules → Add rule (main)

### Basic Settings

- **Branch name pattern**: `main`
- **Enforce all the following rules**

### Require Pull Request Reviews Before Merging

- ✅ **Require pull request reviews before merging**
  - Number of required approvals: **1**
  - Require review from code owners: **✅**
  - Restrict who can dismiss pull request reviews: **✅**
  - Dismiss stale pull request approvals when new commits are pushed: **✅**
  - Allow specified actors to bypass required pull requests**: **❌\*\* (no exceptions)

### Require Commits to be Signed

- ✅ **Require commits to be signed**
  - Ensures commit authenticity
  - Prevents unauthorized changes

### Require Status Checks to Pass Before Merging

- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks:**

- `lint` - Linting must pass
- `test` - Tests must pass with coverage
- `security` - Security audit
- `quality-check` - Code quality checks

### Require Code to be Up-to-Date

- ✅ **Require branches to be up to date before merging**
  - Ensures main is always deployable
  - Prevents merge conflicts

### Merge Controls

- ✅ **Allow merge commits**
  - ✅ Required
  - Reason: Release merges need full history

- ❌ **Allow squash merging**
  - Not recommended for main (use for develop only)

- ❌ **Allow rebase merging**
  - Prefer merge commits for main

### Automatic Deletion

- ✅ **Automatically delete head branches**
  - Keeps repository clean
  - Prevents stale branches

### Restrictions

- ✅ **Restrict who can push to matching branches**
  - Only maintainers (@Rarsus) can push directly (emergency only)
  - Strongly encourages PR workflow

---

## 🛡️ Develop Branch Protection Rules

**Path**: Settings → Branches → Branch protection rules → Add rule (develop)

### Basic Settings

- **Branch name pattern**: `develop`
- **Enforce all the following rules**

### Require Pull Request Reviews Before Merging

- ✅ **Require pull request reviews before merging**
  - Number of required approvals: **1**
  - Require review from code owners: **✅**
  - Restrict who can dismiss pull request reviews: **❌** (allow flexibility)
  - Dismiss stale pull request approvals when new commits are pushed: **✅**

### Require Status Checks to Pass Before Merging

- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks:**

- `lint` - Linting must pass
- `test` - Tests must pass
- `security` - Security audit (non-blocking)

### Merge Controls

- ❌ **Allow merge commits**
  - Use squash for cleaner history

- ✅ **Allow squash merging**
  - Required
  - Keeps develop history clean

- ❌ **Allow rebase merging**
  - Prefer squash for consistency

### Automatic Deletion

- ✅ **Automatically delete head branches**
  - Keeps repository clean

### Restrictions

- ❌ **Restrict who can push**
  - Allow direct pushes for hotfixes if needed
  - Otherwise require PR

---

## 👥 CODEOWNERS Configuration

**Path**: Settings → Code security and analysis → Code owners

File: `.github/CODEOWNERS`

```
# Default owner
* @Rarsus

# Component-specific owners
/src/infra/discord/ @Rarsus
/src/core/ @Rarsus
/tests/ @Rarsus
```

**Effects:**

- Code owners are automatically requested as reviewers
- Cannot be dismissed in PRs (when enabled in branch protection)
- Can override individual PR reviews if needed

---

## 🤖 Automated Features

### Require Status Checks

The following GitHub Actions must pass:

1. **ci.yml** (CI Pipeline)
   - Linting with ESLint
   - Formatting with Prettier
   - Tests with coverage
   - Security audit

2. **pr-quality-gate.yml** (PR Validation)
   - Conventional commits validation
   - PR title validation
   - Coverage threshold check

3. **code-quality.yml** (Code Quality)
   - Code coverage analysis
   - Complexity checks

### Automatic PR Comments

PRs receive automated comments with:

- Quality gate status
- Contributing guidelines
- Expected checks

### Automatic Branch Deletion

After merge, feature branches are automatically deleted:

- Keeps repository organized
- Prevents stale branch accumulation

---

## 🔔 Notifications

### Configure Notification Settings

**Path**: Settings → Notifications

- [ ] Watch this repository
- [ ] Enable email notifications for:
  - Pull request reviews
  - Status checks
  - Failed deployments
  - Security alerts

---

## 🔑 Repository Secrets & Variables

### Required Secrets

**Path**: Settings → Secrets and variables → Actions → Secrets

- [ ] `NPM_TOKEN` - For npm package publishing
- [ ] `GITHUB_TOKEN` - Automatically provided by GitHub

### Environment Variables

**Path**: Settings → Secrets and variables → Actions → Variables

```
NODE_ENV=production
LOG_LEVEL=info
```

---

## ↔️ Branch Naming Strategy

### Recommended Restrictions

Consider enabling branch naming restrictions to enforce the convention:

**Pattern**: `^(main|develop|feature|bugfix|hotfix|release)\/.*`

This ensures all branches follow the naming convention:

- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production fixes
- `release/*` - Release preparation

---

## 🔄 Merge Strategies

### Main Branch

- **Strategy**: Create a merge commit
- **Reason**: Preserves full history for releases
- **Result**: One merge commit per feature

### Develop Branch

- **Strategy**: Squash and merge
- **Reason**: Keeps history clean
- **Result**: One commit per feature

### Automatic Commits

If enabling automatic merge:

- Don't use auto-merge on main
- Can enable auto-merge on develop with restrictions

---

## 📊 Status Check Configuration

### Required Status Checks for Main

All of these must pass:

```
✅ lint / Lint Code
✅ test / Run Tests
✅ security / Security Audit
✅ quality-check / Code Quality Checks
✅ summary / CI Summary
```

### Optional Status Checks

These are informational:

- Code coverage
- Documentation
- Performance benchmarks

---

## 🚨 Emergency Procedures

### Force Push to Main (Emergency Only)

If absolutely necessary to force push to main:

1. **Get approval** from @Rarsus
2. **Document the reason** in a GitHub issue
3. **Notify all contributors** in Slack/email
4. **Temporarily disable** branch protection
5. **Force push** the correct state
6. **Re-enable** branch protection immediately
7. **Create a post-mortem** issue

### Steps to Force Push

```bash
# Only with explicit permission
git checkout main
git fetch origin
git reset --hard <correct-commit-hash>
git push --force-with-lease origin main
```

---

## ✅ Verification Checklist

After configuring branch protection rules:

- [ ] Create a test PR to verify all checks run
- [ ] Confirm CI pipeline blocks merge until checks pass
- [ ] Confirm required reviewers are requested
- [ ] Confirm branch is up-to-date requirement works
- [ ] Confirm auto-deletion of branches works
- [ ] Confirm status checks are blocking (not advisory)
- [ ] Document any deviations from this guide

---

## 🔗 Related Documentation

- [GITFLOW.md](./GITFLOW.md) - Branching strategy and workflow
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Developer contribution guide
- [.github/CODEOWNERS](.github/CODEOWNERS) - Code ownership
- [GitHub Docs - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)

---

**Last Updated**: December 2025
**Maintainer**: @Rarsus
