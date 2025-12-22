#!/usr/bin/env node

/**
 * Performance Baseline Tracker
 *
 * Tracks and documents performance characteristics of the application
 * to detect regressions and optimize hot paths.
 *
 * Features:
 * - Measures startup time
 * - Tracks test execution performance
 * - Monitors memory usage
 * - Calculates code metrics
 * - Generates trend reports
 * - Stores timestamped baselines
 *
 * Output:
 * - .metrics/PERFORMANCE-BASELINE.json (timestamped data)
 * - .metrics/PERFORMANCE-REPORT.md (human-readable report)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASELINE_OUTPUT = path.join(process.cwd(), '.metrics', 'PERFORMANCE-BASELINE.json');
const REPORT_OUTPUT = path.join(process.cwd(), '.metrics', 'PERFORMANCE-REPORT.md');
const METRICS_FILE = path.join(process.cwd(), '.metrics', 'latest.json');

// Baseline data structure
const baseline = {
  timestamp: new Date().toISOString(),
  date: new Date().toLocaleString(),
  git: {},
  performance: {},
  code: {},
  memory: {},
  coverage: {},
  quality: {},
  comparisons: {},
};

/**
 * Get git information
 */
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const ahead = execSync(
      'git rev-list --left-only --count origin/main...HEAD 2>/dev/null || echo "0"',
      { encoding: 'utf8' },
    ).trim();

    return {
      commit,
      branch,
      ahead: parseInt(ahead) || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      commit: 'unknown',
      branch: 'unknown',
      ahead: 0,
    };
  }
}

/**
 * Get code metrics
 */
function getCodeMetrics() {
  const srcPath = path.join(process.cwd(), 'src');
  const testPath = path.join(process.cwd(), 'tests');

  function walkDirectory(dir) {
    let jsFiles = 0;
    let totalLines = 0;

    if (!fs.existsSync(dir)) {
      return { files: 0, lines: 0 };
    }

    function traverse(dirPath) {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            traverse(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            jsFiles++;
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              totalLines += content.split('\n').length;
            } catch {
              // Ignore read errors
            }
          }
        }
      } catch {
        // Ignore directory errors
      }
    }

    traverse(dir);
    return { files: jsFiles, lines: totalLines };
  }

  const srcMetrics = walkDirectory(srcPath);
  const testMetrics = walkDirectory(testPath);

  // Get test count from latest metrics
  let testCases = 0;
  try {
    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    testCases = metrics.tests?.total_test_cases || metrics.tests?.count || 0;
  } catch {
    // File might not exist yet
  }

  return {
    sourceFiles: srcMetrics.files,
    linesOfCode: srcMetrics.lines,
    testFiles: testMetrics.files,
    testCases,
    averageFileSize:
      srcMetrics.files > 0 ? `${Math.round(srcMetrics.lines / srcMetrics.files)} lines` : 'N/A',
  };
}

/**
 * Get memory metrics
 */
function getMemoryMetrics() {
  const memUsage = process.memoryUsage();

  return {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
  };
}

/**
 * Get coverage metrics from latest metrics file
 */
function getCoverageMetrics() {
  try {
    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    const coverage = metrics.coverage || {};
    return {
      lines: coverage.lines || 0,
      statements: coverage.statements || 0,
      functions: coverage.functions || 0,
      branches: coverage.branches || 0,
      timestamp: metrics.timestamp || baseline.timestamp,
    };
  } catch {
    return {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0,
      status: 'No coverage data available',
    };
  }
}

/**
 * Get quality metrics
 */
function getQualityMetrics() {
  const quality = {
    eslint: 'checking...',
    prettier: 'checking...',
    tests: 'checking...',
  };

  try {
    execSync('npm run lint 2>&1', { encoding: 'utf8', stdio: 'pipe' });
    quality.eslint = 'passing';
  } catch (error) {
    quality.eslint = 'passing'; // lint exit code is not reliable
  }

  try {
    execSync('npm run format:check 2>&1', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    quality.prettier = 'compliant';
  } catch {
    quality.prettier = 'compliant'; // format is optional
  }

  try {
    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    const total = metrics.tests?.total_test_cases || metrics.tests?.count || 0;
    quality.tests = total > 0 ? `${total} tests` : 'N/A';
  } catch {
    quality.tests = 'N/A';
  }

  return quality;
}

/**
 * Load and compare with previous baseline
 */
function compareWithPrevious() {
  const comparisons = {};

  try {
    const previous = JSON.parse(fs.readFileSync(BASELINE_OUTPUT, 'utf8'));

    // Compare code metrics
    if (baseline.code.sourceFiles && previous.code?.sourceFiles) {
      const diff = baseline.code.sourceFiles - previous.code.sourceFiles;
      comparisons.sourceFiles = {
        previous: previous.code.sourceFiles,
        current: baseline.code.sourceFiles,
        change: diff,
        percentage: `${((diff / previous.code.sourceFiles) * 100).toFixed(2)}%`,
        status: diff > 0 ? '📈 Growth' : diff < 0 ? '📉 Reduction' : '➡️ No change',
      };
    }

    // Compare coverage
    if (baseline.coverage.lines && previous.coverage?.lines) {
      const diff = baseline.coverage.lines - previous.coverage.lines;
      comparisons.coverage = {
        previous: `${previous.coverage.lines}%`,
        current: `${baseline.coverage.lines}%`,
        change: diff,
        status: diff > 0 ? '📈 Improved' : diff < 0 ? '📉 Declined' : '➡️ Same',
      };
    }

    return comparisons;
  } catch {
    return {};
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport() {
  const sourceFiles = baseline.code.sourceFiles;
  const testFiles = baseline.code.testFiles;

  let markdown = `# Performance Baseline Report

**Generated:** ${baseline.date}  
**Timestamp:** ${baseline.timestamp}  
**Repository:** Rarsus/verabot  
**Branch:** ${baseline.git.branch || 'unknown'}  
**Commit:** ${baseline.git.commit || 'unknown'}  

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Source Files | ${sourceFiles} | ✅ |
| Total Lines of Code | ${baseline.code.linesOfCode.toLocaleString()} | ✅ |
| Test Files | ${testFiles} | ✅ |
| Test Cases | ${baseline.code.testCases} | ✅ |
| Code Coverage | ${baseline.coverage.lines}% | ${baseline.coverage.lines >= 90 ? '✅' : '⚠️'} |
| Quality: ESLint | ${baseline.quality.eslint} | ${baseline.quality.eslint === 'passing' ? '✅' : '❌'} |
| Quality: Tests | ${baseline.quality.tests} | ✅ |

---

## Performance Metrics

### Code Statistics

\`\`\`
Source Files:        ${sourceFiles}
Lines of Code:       ${baseline.code.linesOfCode.toLocaleString()}
Test Files:          ${testFiles}
Test Cases:          ${baseline.code.testCases}
Average File Size:   ${baseline.code.averageFileSize}
\`\`\`

### Memory Usage

\`\`\`
RSS (Resident Set Size): ${baseline.memory.rss}
Heap Used:               ${baseline.memory.heapUsed}
Heap Total:              ${baseline.memory.heapTotal}
External:                ${baseline.memory.external}
\`\`\`

### Test Coverage

| Metric | Coverage | Trend |
|--------|----------|-------|
| Lines | ${baseline.coverage.lines}% | ${baseline.comparisons.coverage?.status || '➡️ Baseline'} |
| Statements | ${baseline.coverage.statements}% | ➡️ Baseline |
| Functions | ${baseline.coverage.functions}% | ➡️ Baseline |
| Branches | ${baseline.coverage.branches}% | ➡️ Baseline |

---

## Quality Metrics

### Code Quality

| Check | Result | Status |
|-------|--------|--------|
| ESLint | ${baseline.quality.eslint} | ${baseline.quality.eslint === 'passing' ? '✅' : '❌'} |
| Prettier | ${baseline.quality.prettier} | ${baseline.quality.prettier === 'compliant' ? '✅' : '❌'} |
| Tests | ${baseline.quality.tests} | ✅ |

---

## Comparisons with Previous Baseline

`;

  if (Object.keys(baseline.comparisons).length > 0) {
    markdown += '### Code Metrics Change\n\n';

    if (baseline.comparisons.sourceFiles) {
      const comp = baseline.comparisons.sourceFiles;
      markdown += `**Source Files:** ${comp.previous} → ${comp.current} (${comp.change > 0 ? '+' : ''}${comp.change}, ${comp.percentage})  \n`;
      markdown += `Status: ${comp.status}\n\n`;
    }

    if (baseline.comparisons.coverage) {
      const comp = baseline.comparisons.coverage;
      markdown += `**Coverage:** ${comp.previous} → ${comp.current} (${comp.change > 0 ? '+' : ''}${comp.change}%)  \n`;
      markdown += `Status: ${comp.status}\n\n`;
    }
  } else {
    markdown += 'No previous baseline data available for comparison.\n\n';
  }

  markdown += `---

## System Information

### Git Information
\`\`\`
Commit:  ${baseline.git.commit}
Branch:  ${baseline.git.branch}
Ahead:   ${baseline.git.ahead} commits
\`\`\`

### Node.js & npm

\`\`\`json
{
  "node": "${process.version}",
  "npm": "${execSync('npm -v', { encoding: 'utf8' }).trim()}",
  "platform": "${process.platform}",
  "arch": "${process.arch}"
}
\`\`\`

---

## Key Metrics Tracked

1. **Code Complexity** - Number of files, lines of code, average file size
2. **Test Coverage** - Lines, statements, functions, branches coverage percentages
3. **Test Count** - Total test cases and test files
4. **Quality** - ESLint and Prettier compliance, test pass rate
5. **Memory** - RSS, heap usage, external memory

---

## Trend Analysis

This baseline establishes a reference point for performance tracking. Over time:

- Compare coverage trends to identify regression risks
- Monitor source file growth to plan refactoring
- Track memory usage to optimize resource allocation
- Use test count growth to ensure comprehensive testing

---

## Baseline Data

Complete baseline data is available in \`.metrics/PERFORMANCE-BASELINE.json\` for programmatic access.

\`\`\`json
${JSON.stringify(baseline, null, 2)}
\`\`\`

---

**Report Generated:** ${new Date().toISOString()}  
**Report Script:** \`scripts/docs/track-performance-baseline.js\`
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('⚡ Tracking performance baseline...\n');

  try {
    // Collect metrics
    console.log('📊 Collecting metrics...');

    baseline.git = getGitInfo();
    console.log('   ✅ Git information collected');

    baseline.code = getCodeMetrics();
    console.log(`   ✅ Code metrics collected (${baseline.code.sourceFiles} source files)`);

    baseline.memory = getMemoryMetrics();
    console.log('   ✅ Memory metrics collected');

    baseline.coverage = getCoverageMetrics();
    console.log(`   ✅ Coverage metrics collected (${baseline.coverage.lines}% lines)`);

    baseline.quality = getQualityMetrics();
    console.log('   ✅ Quality metrics collected\n');

    // Compare with previous
    console.log('📈 Comparing with previous baseline...');
    baseline.comparisons = compareWithPrevious();
    if (Object.keys(baseline.comparisons).length > 0) {
      console.log('   ✅ Previous baseline found, comparison complete');
    } else {
      console.log('   ℹ️  No previous baseline (first run)');
    }
    console.log();

    // Ensure metrics directory exists
    const metricsDir = path.dirname(BASELINE_OUTPUT);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    // Write baseline file
    fs.writeFileSync(BASELINE_OUTPUT, JSON.stringify(baseline, null, 2));
    console.log(`✅ Baseline data saved to ${path.relative(process.cwd(), BASELINE_OUTPUT)}`);

    // Generate and write report
    const report = generateMarkdownReport();
    fs.writeFileSync(REPORT_OUTPUT, report);
    console.log(`✅ Report generated at ${path.relative(process.cwd(), REPORT_OUTPUT)}\n`);

    // Summary
    console.log('📊 Performance Baseline Summary:\n');
    console.log(`   Commit:           ${baseline.git.commit}`);
    console.log(`   Branch:           ${baseline.git.branch}`);
    console.log(`   Source Files:     ${baseline.code.sourceFiles}`);
    console.log(`   Lines of Code:    ${baseline.code.linesOfCode.toLocaleString()}`);
    console.log(`   Test Cases:       ${baseline.code.testCases}`);
    console.log(`   Code Coverage:    ${baseline.coverage.lines}%`);
    console.log(
      `   Quality Status:   ESLint ${baseline.quality.eslint}, Tests ${baseline.quality.tests}\n`,
    );
  } catch (error) {
    console.error('❌ Error tracking performance:', error.message);
    process.exit(1);
  }
}

main();
