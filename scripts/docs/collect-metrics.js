#!/usr/bin/env node

/**
 * Collect Metrics
 * Extracts code metrics from tests, source code, and coverage reports
 *
 * Usage: node scripts/docs/collect-metrics.js
 *
 * This script:
 * 1. Parses Jest coverage output
 * 2. Counts test files and test cases
 * 3. Analyzes source code structure (handlers, services, middleware)
 * 4. Generates metrics report
 * 5. Stores metrics in .metrics/latest.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const METRICS_OUTPUT_PATH = path.join(__dirname, '../../.metrics/latest.json');
const SRC_PATH = path.join(__dirname, '../../src');
const COVERAGE_PATH = path.join(__dirname, '../../coverage/coverage-summary.json');
const TESTS_PATH = path.join(__dirname, '../../tests');

/**
 * Count files matching a pattern
 */
function countFiles(directory, pattern = /.js$/) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  walkDir(directory);
  return files;
}

/**
 * Count test cases in test files
 */
function countTestCases(testFiles) {
  let totalTests = 0;
  let totalSuites = 0;

  for (const file of testFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Count describe blocks (test suites)
    const describeMatches = content.match(/describe\(/g);
    totalSuites += describeMatches ? describeMatches.length : 0;

    // Count test cases (it/test blocks)
    const itMatches = content.match(/\b(it|test)\(/g);
    totalTests += itMatches ? itMatches.length : 0;
  }

  return { totalTests, totalSuites };
}

/**
 * Analyze source code structure
 */
function analyzeSourceCode() {
  const structure = {
    handlers: {
      admin: 0,
      core: 0,
      messaging: 0,
      operations: 0,
      total: 0,
    },
    services: 0,
    middleware: 0,
    commands: {},
    totalFiles: 0,
    totalLines: 0,
  };

  // Count handlers
  const handlerDirs = ['admin', 'core', 'messaging', 'operations'];
  handlerDirs.forEach((dir) => {
    const dirPath = path.join(SRC_PATH, 'app/handlers', dir);
    if (fs.existsSync(dirPath)) {
      const files = countFiles(dirPath);
      structure.handlers[dir] = files.length;
      structure.handlers.total += files.length;
    }
  });

  // Count services
  const servicesPath = path.join(SRC_PATH, 'core/services');
  if (fs.existsSync(servicesPath)) {
    const services = countFiles(servicesPath);
    structure.services = services.length;
  }

  // Count middleware
  const middlewarePath = path.join(SRC_PATH, 'app/middleware');
  if (fs.existsSync(middlewarePath)) {
    const middleware = countFiles(middlewarePath);
    structure.middleware = middleware.length;
  }

  // Count all source files and lines
  const allSourceFiles = countFiles(SRC_PATH);
  structure.totalFiles = allSourceFiles.length;

  allSourceFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    structure.totalLines += content.split('\n').length;
  });

  return structure;
}

/**
 * Read coverage report if available
 */
function readCoverage() {
  const coverage = {
    available: false,
    lines: 0,
    statements: 0,
    functions: 0,
    branches: 0,
    timestamp: null,
  };

  if (fs.existsSync(COVERAGE_PATH)) {
    try {
      const summaryData = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));
      const total = summaryData.total;

      coverage.available = true;
      coverage.lines = total.lines.pct;
      coverage.statements = total.statements.pct;
      coverage.functions = total.functions.pct;
      coverage.branches = total.branches.pct;
      coverage.timestamp = new Date(fs.statSync(COVERAGE_PATH).mtime).toISOString();
    } catch (error) {
      console.warn(`⚠️  Could not parse coverage data: ${error.message}`);
    }
  }

  return coverage;
}

/**
 * Count test files
 */
function countTestFiles() {
  const testFiles = countFiles(TESTS_PATH);
  const { totalTests, totalSuites } = countTestCases(testFiles);

  return {
    total_test_files: testFiles.length,
    total_test_suites: totalSuites,
    total_test_cases: totalTests,
  };
}

/**
 * Run tests and extract metrics
 */
function runTestsAndCollectMetrics() {
  try {
    console.log('🧪 Running tests to collect metrics...');
    execSync('npm test -- --coverage', { stdio: 'pipe' });
    console.log('✅ Tests completed');
  } catch (error) {
    console.warn('⚠️  Tests had failures or warnings, but metrics will still be collected');
  }
}

/**
 * Generate metrics report
 */
function generateMetricsReport(metrics) {
  const lines = [
    '# Code Metrics Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Application Files | ${metrics.source_code.totalFiles} |`,
    `| Source Lines of Code | ${metrics.source_code.totalLines} |`,
    `| Test Files | ${metrics.tests.total_test_files} |`,
    `| Test Suites | ${metrics.tests.total_test_suites} |`,
    `| Test Cases | ${metrics.tests.total_test_cases} |`,
    `| Code Coverage (Lines) | ${metrics.coverage.lines}% |`,
    `| Code Coverage (Statements) | ${metrics.coverage.statements}% |`,
    `| Code Coverage (Functions) | ${metrics.coverage.functions}% |`,
    `| Code Coverage (Branches) | ${metrics.coverage.branches}% |`,
    '',
    '## Architecture',
    '',
    '| Component | Count |',
    '|-----------|-------|',
    `| Admin Handlers | ${metrics.source_code.handlers.admin} |`,
    `| Core Handlers | ${metrics.source_code.handlers.core} |`,
    `| Messaging Handlers | ${metrics.source_code.handlers.messaging} |`,
    `| Operations Handlers | ${metrics.source_code.handlers.operations} |`,
    `| Total Handlers | ${metrics.source_code.handlers.total} |`,
    `| Services | ${metrics.source_code.services} |`,
    `| Middleware | ${metrics.source_code.middleware} |`,
    '',
    '## Coverage Details',
    '',
    `- **Lines:** ${metrics.coverage.lines}%`,
    `- **Statements:** ${metrics.coverage.statements}%`,
    `- **Functions:** ${metrics.coverage.functions}%`,
    `- **Branches:** ${metrics.coverage.branches}%`,
    '',
    metrics.coverage.timestamp
      ? `Last updated: ${metrics.coverage.timestamp}`
      : 'Coverage data not available',
  ];

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📊 Collecting code metrics...\n');

  try {
    // Run tests to generate coverage
    runTestsAndCollectMetrics();

    // Collect metrics
    console.log('\n📈 Analyzing source code...');
    const sourceCode = analyzeSourceCode();

    console.log('📋 Counting tests...');
    const tests = countTestFiles();

    console.log('📊 Reading coverage...');
    const coverage = readCoverage();

    // Create metrics object
    const metrics = {
      timestamp: new Date().toISOString(),
      source_code: sourceCode,
      tests,
      coverage,
    };

    // Save metrics
    fs.writeFileSync(METRICS_OUTPUT_PATH, JSON.stringify(metrics, null, 2), 'utf8');
    console.log(`✅ Metrics saved to ${METRICS_OUTPUT_PATH}`);

    // Generate and save report
    const report = generateMetricsReport(metrics);
    const reportPath = path.join(__dirname, '../../.metrics/METRICS-REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Report saved to ${reportPath}`);

    // Print summary
    console.log('\n📊 Metrics Summary:');
    console.log(`   Source Files: ${sourceCode.totalFiles}`);
    console.log(`   Source Lines: ${sourceCode.totalLines}`);
    console.log(`   Test Files: ${tests.total_test_files}`);
    console.log(`   Test Cases: ${tests.total_test_cases}`);
    console.log(`   Coverage (Lines): ${coverage.lines}%`);
    console.log(`   Handlers: ${sourceCode.handlers.total}`);
    console.log(`   Services: ${sourceCode.services}`);
    console.log(`   Middleware: ${sourceCode.middleware}`);
  } catch (error) {
    console.error(`❌ Error collecting metrics: ${error.message}`);
    process.exit(1);
  }
}

main();
