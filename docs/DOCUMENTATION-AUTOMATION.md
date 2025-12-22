# Documentation Automation Guide

This guide explains the automated documentation maintenance system for VeraBot.

---

## 🎯 Overview

The documentation automation system consists of three core components:

1. **Version Synchronization** - Automatically extract and document dependency versions
2. **Metrics Collection** - Collect code metrics (test count, coverage, architecture stats)
3. **Documentation Validation** - Validate links, detect orphaned files, verify syntax

These scripts ensure documentation stays current and accurate with minimal manual effort.

---

## 📋 Available Scripts

### `npm run docs:sync-versions`

Extracts version information from `package.json` and updates documentation.

**What it does:**

- Reads all dependencies and dev dependencies from package.json
- Extracts Node.js and npm version requirements
- Generates a compatibility matrix for critical dependencies
- Creates/updates `docs/VERSIONS.md` with version information
- Saves JSON version data to `.metrics/VERSIONS.json`

**Output:**

```
✅ Version information saved to .metrics/VERSIONS.json
✅ Version documentation updated at docs/VERSIONS.md

📊 Summary:
   Project: verabot v1.0.0
   Node.js: v18+
   Dependencies: 13
   Dev Dependencies: 8
```

**When to use:**

- After updating package.json dependencies
- Before releases to ensure docs are current
- In CI/CD pipeline (runs on every push)
- Manually before documentation reviews

**Files updated:**

- `docs/VERSIONS.md` - Human-readable version documentation
- `.metrics/VERSIONS.json` - Machine-readable version data

---

### `npm run docs:collect-metrics`

Collects code metrics from the project and generates reports.

**What it does:**

- Runs full test suite with coverage
- Parses Jest coverage output
- Counts source files and lines of code
- Counts test files, suites, and test cases
- Analyzes source code structure:
  - Number of handlers (admin, core, messaging, operations)
  - Number of services
  - Number of middleware
- Generates metrics report

**Output:**

```
📊 Metrics Summary:
   Source Files: 62
   Source Lines: 3885
   Test Files: 55
   Test Cases: 676
   Coverage (Lines): 92.34%
   Handlers: 18
   Services: 5
   Middleware: 4
```

**When to use:**

- Before releases
- After significant code changes
- Quarterly for trend analysis
- In CI/CD pipeline (runs on every successful test)

**Files updated:**

- `.metrics/latest.json` - JSON metrics data
- `.metrics/METRICS-REPORT.md` - Human-readable metrics report

**Metrics tracked:**

- Total test count (updated automatically)
- Code coverage percentages (lines, statements, functions, branches)
- Source code statistics (files, lines)
- Architecture metrics (handlers, services, middleware)
- Timestamps for trend analysis

---

### `npm run docs:validate`

Validates documentation for broken links, missing files, and syntax errors.

**What it does:**

- Scans all markdown files in docs/ and root
- Extracts links (markdown and reference-style)
- Validates all internal links point to existing files
- Validates code blocks (JSON, YAML syntax)
- Detects orphaned documentation files
- Identifies common documentation issues

**Output:**

```
📊 Results:
   Files Processed: 51
   Broken Links: 0
   Syntax Errors: 0
   Warnings: 4
   Orphaned Files: 0

📄 Reports saved to:
   - .metrics/DOCS-VALIDATION-REPORT.md
   - .metrics/VALIDATION-REPORT.json
```

**When to use:**

- Before releases
- After adding/moving documentation
- Regularly to catch link drift
- In CI/CD pipeline (runs on every push)

**Checks performed:**

- ✅ All markdown links exist and are valid
- ✅ External links are not checked (can be broken)
- ✅ JSON code blocks have valid syntax
- ✅ YAML code blocks don't use tabs
- ✅ All files have proper headings
- ✅ No very short/empty files
- ✅ No orphaned documentation

**Files updated:**

- `.metrics/VALIDATION-REPORT.json` - Detailed validation results
- `.metrics/DOCS-VALIDATION-REPORT.md` - Human-readable validation report

---

### `npm run docs:check`

Convenience command that runs validation and version sync.

**Equivalent to:**

```bash
npm run docs:validate && npm run docs:sync-versions
```

**When to use:**

- Before committing documentation changes
- Pre-push hook for local validation
- Quick documentation audit

---

## 🔄 CI/CD Integration

Documentation validation is integrated into the GitHub Actions CI pipeline:

### Workflow: `.github/workflows/ci.yml`

A new `docs-validation` job runs on every push and PR:

```yaml
docs-validation:
  runs-on: ubuntu-latest
  name: Documentation Validation
  timeout-minutes: 10

  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
    - name: Install dependencies
      run: npm ci
    - name: Validate documentation links
      run: npm run docs:validate
    - name: Sync version information
      run: npm run docs:sync-versions
    - name: Upload validation reports
      uses: actions/upload-artifact@v4
      with:
        name: documentation-reports
        path: .metrics/
```

**What happens:**

1. ✅ Links are validated on every push
2. ✅ Broken links are reported
3. ✅ Version information is automatically synced
4. ✅ Reports are saved as artifacts (30 days)
5. ⚠️ Non-blocking (doesn't fail CI, but issues are reported)

**Artifacts:**

- Available in "Artifacts" section of GitHub Actions
- Includes all validation reports
- Retained for 30 days
- Download to review details

---

## 🛠️ Local Workflow

### Pre-commit Hook (Recommended)

Add to `.husky/pre-commit`:

```bash
#!/bin/bash
# Validate documentation before committing
npm run docs:validate
```

Then run:

```bash
npx husky add .husky/pre-commit "npm run docs:validate"
```

### Local Pre-push

Add to `.git/hooks/pre-push`:

```bash
#!/bin/bash
# Run full documentation checks before pushing
npm run docs:check
echo "📋 Documentation checks complete"
```

### Manual Checks

Before committing documentation changes:

```bash
# Validate all links and syntax
npm run docs:validate

# Sync versions if you updated package.json
npm run docs:sync-versions

# Get metrics if code changed significantly
npm run docs:collect-metrics
```

---

## 📊 Understanding the Reports

### VALIDATION-REPORT.json

Machine-readable validation results:

```json
{
  "timestamp": "2025-12-22T10:30:00.000Z",
  "summary": {
    "files_processed": 51,
    "broken_links": 0,
    "syntax_errors": 0,
    "warnings": 4,
    "orphaned_files": 0
  },
  "issues": {
    "broken_links": [],
    "syntax_errors": [],
    "warnings": [
      {
        "file": "docs/example.md",
        "message": "File does not start with a heading (#)"
      }
    ],
    "orphaned_files": []
  }
}
```

### VERSIONS.json

Version information extracted from package.json:

```json
{
  "extracted_at": "2025-12-22T10:30:00.000Z",
  "project": {
    "name": "verabot",
    "version": "1.0.0",
    "type": "commonjs"
  },
  "engines": {
    "node": "v18+",
    "npm": "v9+"
  },
  "dependencies": {
    "production": {
      "discord.js": "^14.16.0",
      "express": "^5.0.0",
      ...
    }
  },
  "compatibility_matrix": {
    "critical_dependencies": { ... },
    "notes": [ ... ]
  }
}
```

### latest.json

Code metrics from the project:

```json
{
  "timestamp": "2025-12-22T10:30:00.000Z",
  "source_code": {
    "handlers": {
      "admin": 8,
      "core": 5,
      "messaging": 2,
      "operations": 3,
      "total": 18
    },
    "services": 5,
    "middleware": 4,
    "totalFiles": 62,
    "totalLines": 3885
  },
  "tests": {
    "total_test_files": 55,
    "total_test_suites": 100,
    "total_test_cases": 676
  },
  "coverage": {
    "lines": 92.34,
    "statements": 92.41,
    "functions": 90.55,
    "branches": 87.23
  }
}
```

---

## 🚨 Troubleshooting

### Script fails: "Cannot find module"

**Solution:** Ensure dependencies are installed

```bash
npm install
```

### Validation reports not generated

**Solution:** Check that scripts directory exists

```bash
ls -la scripts/docs/
# Should show: sync-versions.js, collect-metrics.js, validate-docs.js
```

### Coverage data not found

**Solution:** Run tests first to generate coverage

```bash
npm run test:coverage
npm run docs:collect-metrics
```

### Links report as broken when they're valid

**Solution:** Check for encoding issues or special characters

- Links must use forward slashes: `docs/file.md`
- Anchors must match heading slugs: `#valid-heading`
- Test with absolute paths if relative paths fail

### Version sync doesn't update docs

**Solution:** Check file permissions

```bash
chmod +x scripts/docs/sync-versions.js
npm run docs:sync-versions
```

---

## 📈 Metrics Tracking Over Time

### Using metrics for trend analysis

Store metrics periodically:

```bash
# Create timestamped backup
cp .metrics/latest.json .metrics/metrics-2025-12-22.json
cp .metrics/METRICS-REPORT.md .metrics/reports/metrics-2025-12-22.md
```

### Tracking key metrics

Key metrics to monitor:

| Metric        | Target     | Current     |
| ------------- | ---------- | ----------- |
| Code Coverage | >85%       | 92.34% ✅   |
| Test Count    | Growing    | 676 ✅      |
| Handlers      | Manageable | 18 ✅       |
| Services      | Organized  | 5 ✅        |
| Documentation | Complete   | 51 files ✅ |

---

## 🔗 Integration with Development Process

### Feature Branch Workflow

1. Create feature branch
2. Make documentation changes
3. Run `npm run docs:validate` locally
4. Commit changes
5. Push (CI validates automatically)
6. GitHub Actions runs validation
7. Review artifacts if issues found

### Release Workflow

Before releasing:

```bash
# Collect latest metrics
npm run docs:collect-metrics

# Validate all documentation
npm run docs:validate

# Sync versions
npm run docs:sync-versions

# Commit and tag
git add docs/ .metrics/
git commit -m "docs: update metrics and versions for v1.1.0"
git tag v1.1.0
```

### Documentation Update Workflow

```bash
# Make documentation changes
vim docs/some-file.md

# Validate changes
npm run docs:validate

# If package.json was updated
npm run docs:sync-versions

# Commit
git add docs/
git commit -m "docs: update documentation"
```

---

## 📚 Related Documentation

- [GITFLOW.md](../GITFLOW.md) - Git workflow and branch management
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Developer contribution guidelines
- [docs/VERSIONS.md](../docs/VERSIONS.md) - Generated version information
- [DOCUMENTATION-AUDIT-ISSUE.md](../DOCUMENTATION-AUDIT-ISSUE.md) - Complete audit report

---

## 💡 Best Practices

1. **Run docs:validate before committing** - Catch issues early
2. **Sync versions after updating dependencies** - Keep docs current
3. **Review metrics before releases** - Track project growth
4. **Check CI artifacts regularly** - Monitor documentation health
5. **Keep .metrics/ generated (don't edit manually)** - Scripts handle updates
6. **Use relative links in documentation** - Validation catches broken ones
7. **Add headings to all markdown files** - Helps with structure

---

## 🔮 Future Enhancements

Potential additions to automation:

- [ ] Auto-generate API documentation from JSDoc
- [ ] Auto-generate changelog from git history
- [ ] Architecture diagram generation
- [ ] Dead code detection
- [ ] Spell checker for documentation
- [ ] SEO optimization checks
- [ ] Accessibility (a11y) validation
- [ ] Performance baseline tracking

---

**Last Updated:** December 22, 2025  
**Maintained By:** Documentation Automation System
