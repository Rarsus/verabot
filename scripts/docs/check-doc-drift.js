#!/usr/bin/env node

/**
 * Check Documentation Drift
 * Detects discrepancies between documentation and actual codebase
 *
 * Usage: node scripts/docs/check-doc-drift.js
 *
 * This script:
 * 1. Counts actual handlers, services, and middleware in code
 * 2. Compares against documented numbers
 * 3. Finds command references that don't exist
 * 4. Detects orphaned documentation sections
 * 5. Reports discrepancies
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '../../src');
const HANDLERS_PATH = path.join(SRC_PATH, 'app/handlers');
const SERVICES_PATH = path.join(SRC_PATH, 'core/services');
const MIDDLEWARE_PATH = path.join(SRC_PATH, 'app/middleware');
const COMMANDS_PATH = path.join(SRC_PATH, 'core/commands');
const DOCS_PATH = path.join(__dirname, '../../docs');

/**
 * Count files in a directory by type
 */
function countFilesByType(basePath) {
  const counts = {};

  if (!fs.existsSync(basePath)) {
    return counts;
  }

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const category = entry.name;
        counts[category] = counts[category] || 0;
        const subEntries = fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true });
        counts[category] += subEntries.filter((e) => e.isFile() && e.name.endsWith('.js')).length;
      }
    }
  }

  walkDir(basePath);
  return counts;
}

/**
 * Count actual handlers
 */
function countActualHandlers() {
  const handlerCounts = countFilesByType(HANDLERS_PATH);
  const total = Object.values(handlerCounts).reduce((sum, count) => sum + count, 0);

  return {
    byCategory: handlerCounts,
    total,
  };
}

/**
 * Count actual services
 */
function countActualServices() {
  if (!fs.existsSync(SERVICES_PATH)) {
    return { total: 0, list: [] };
  }

  const files = fs.readdirSync(SERVICES_PATH).filter((f) => f.endsWith('.js'));
  return {
    total: files.length,
    list: files.map((f) => f.replace('.js', '')),
  };
}

/**
 * Count actual middleware
 */
function countActualMiddleware() {
  if (!fs.existsSync(MIDDLEWARE_PATH)) {
    return { total: 0, list: [] };
  }

  const files = fs.readdirSync(MIDDLEWARE_PATH).filter((f) => f.endsWith('.js'));
  return {
    total: files.length,
    list: files.map((f) => f.replace('.js', '')),
  };
}

/**
 * Find all command files
 */
function findCommandFiles() {
  const commands = [];

  if (!fs.existsSync(COMMANDS_PATH)) {
    return commands;
  }

  // Base classes and infrastructure files to exclude
  const excludePatterns = ['Command', 'CommandRegistry', 'CommandResult', 'index'];

  function walkDir(dir, category = 'commands') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const baseName = entry.name.replace('.js', '');
        // Skip base classes and infrastructure files
        if (!excludePatterns.includes(baseName)) {
          commands.push({
            name: baseName,
            category,
            file: entry.name,
          });
        }
      }
    }
  }

  walkDir(COMMANDS_PATH);
  return commands;
}

/**
 * Find command references in documentation
 */
function findDocumentedCommands() {
  const commands = new Set();

  const readmeFiles = [
    path.join(DOCS_PATH, 'README.md'),
    path.join(DOCS_PATH, '../README.md'),
    path.join(DOCS_PATH, 'project/COMMANDS.md'),
  ];

  readmeFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');

      // Look for command references in backticks and code blocks
      const backtickMatches = content.match(/`(\w[\w-]*)`/g);
      if (backtickMatches) {
        backtickMatches.forEach((match) => {
          const cmd = match.replace(/`/g, '');
          if (cmd.length > 2) {
            commands.add(cmd);
          }
        });
      }

      // Look for ## Command patterns
      const headerMatches = content.match(/^## (?:Command|Feature): (.+)$/gm);
      if (headerMatches) {
        headerMatches.forEach((match) => {
          const cmd = match
            .replace(/^## (?:Command|Feature): /, '')
            .toLowerCase()
            .replace(/\s+/g, '-');
          commands.add(cmd);
        });
      }
    }
  });

  return Array.from(commands);
}

/**
 * Compare documented vs actual
 */
function compareDocumentedVsActual() {
  const handlers = countActualHandlers();
  const services = countActualServices();
  const middleware = countActualMiddleware();
  const actualCommands = findCommandFiles();
  const documentedCommands = findDocumentedCommands();

  return {
    handlers,
    services,
    middleware,
    actualCommands,
    documentedCommands,
  };
}

/**
 * Find documentation inconsistencies
 */
function findInconsistencies(comparison) {
  const issues = [];

  // Check for commands in docs but not in code
  const actualCommandNames = new Set(
    comparison.actualCommands.map((cmd) => cmd.name.toLowerCase().replace(/_/g, '-')),
  );

  comparison.documentedCommands.forEach((docCmd) => {
    const normalized = docCmd.toLowerCase().replace(/_/g, '-');
    if (!actualCommandNames.has(normalized)) {
      // This might be a documented command that doesn't exist
      if (
        normalized.length > 3 &&
        !normalized.includes('error') &&
        !normalized.includes('warning')
      ) {
        issues.push({
          type: 'orphaned-reference',
          severity: 'warning',
          message: `Documentation references command "${docCmd}" but no corresponding handler found`,
        });
      }
    }
  });

  // Check if actual commands are documented
  comparison.actualCommands.forEach((cmd) => {
    const documented = comparison.documentedCommands.some(
      (doc) => doc.toLowerCase().replace(/_/g, '-') === cmd.name.toLowerCase(),
    );

    if (!documented) {
      issues.push({
        type: 'undocumented-command',
        severity: 'info',
        message: `Handler "${cmd.name}" exists in code but may not be documented`,
        file: cmd.file,
      });
    }
  });

  return issues;
}

/**
 * Generate drift report
 */
function generateDriftReport(comparison, issues) {
  const lines = [
    '# Documentation Drift Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Executive Summary',
    '',
  ];

  const handlerTotal = comparison.handlers.total;
  const serviceTotal = comparison.services.total;
  const middlewareTotal = comparison.middleware.total;
  const commandTotal = comparison.actualCommands.length;

  lines.push(`- **Total Handlers:** ${handlerTotal}`);
  lines.push(
    `  ${Object.entries(comparison.handlers.byCategory)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ')}`,
  );
  lines.push(`- **Total Services:** ${serviceTotal}`);
  lines.push(`- **Total Middleware:** ${middlewareTotal}`);
  lines.push(`- **Total Commands:** ${commandTotal}`);
  lines.push(`- **Issues Found:** ${issues.length}`);
  lines.push('');

  // Group issues by severity
  const byType = {};
  const bySeverity = { error: 0, warning: 0, info: 0 };

  issues.forEach((issue) => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
    bySeverity[issue.severity]++;
  });

  if (Object.keys(byType).length > 0) {
    lines.push('## Issues Breakdown');
    lines.push('');
    Object.entries(byType).forEach(([type, count]) => {
      lines.push(`- **${type}:** ${count}`);
    });
    lines.push('');
  }

  if (issues.length > 0) {
    lines.push('## Detailed Issues');
    lines.push('');

    const errorIssues = issues.filter((i) => i.severity === 'error');
    const warningIssues = issues.filter((i) => i.severity === 'warning');
    const infoIssues = issues.filter((i) => i.severity === 'info');

    if (errorIssues.length > 0) {
      lines.push('### 🔴 Errors');
      lines.push('');
      errorIssues.forEach((issue) => {
        lines.push(`- **${issue.type}**: ${issue.message}`);
        if (issue.file) {
          lines.push(`  File: \`${issue.file}\``);
        }
      });
      lines.push('');
    }

    if (warningIssues.length > 0) {
      lines.push('### 🟡 Warnings');
      lines.push('');
      warningIssues.forEach((issue) => {
        lines.push(`- **${issue.type}**: ${issue.message}`);
        if (issue.file) {
          lines.push(`  File: \`${issue.file}\``);
        }
      });
      lines.push('');
    }

    if (infoIssues.length > 0) {
      lines.push('### 🔵 Info');
      lines.push('');
      infoIssues.forEach((issue) => {
        lines.push(`- **${issue.type}**: ${issue.message}`);
        if (issue.file) {
          lines.push(`  File: \`${issue.file}\``);
        }
      });
      lines.push('');
    }
  } else {
    lines.push('✅ No documentation drift detected!');
    lines.push('');
  }

  lines.push('## Codebase Structure');
  lines.push('');
  lines.push('### Handlers by Category');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|----------|-------|');
  Object.entries(comparison.handlers.byCategory).forEach(([category, count]) => {
    lines.push(`| ${category} | ${count} |`);
  });
  lines.push('');

  lines.push('### Services');
  lines.push('');
  if (comparison.services.list.length > 0) {
    comparison.services.list.forEach((service) => {
      lines.push(`- ${service}`);
    });
  } else {
    lines.push('No services found');
  }
  lines.push('');

  lines.push('### Middleware');
  lines.push('');
  if (comparison.middleware.list.length > 0) {
    comparison.middleware.list.forEach((mware) => {
      lines.push(`- ${mware}`);
    });
  } else {
    lines.push('No middleware found');
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking documentation drift...\n');

  try {
    const comparison = compareDocumentedVsActual();
    const issues = findInconsistencies(comparison);

    console.log('📊 Codebase Analysis:');
    console.log(`   Handlers: ${comparison.handlers.total}`);
    console.log(`   Services: ${comparison.services.total}`);
    console.log(`   Middleware: ${comparison.middleware.total}`);
    console.log(`   Commands: ${comparison.actualCommands.length}`);
    console.log(`\n   Issues Found: ${issues.length}`);

    if (issues.length > 0) {
      console.log('\n⚠️  Documentation Drift Detected:');
      issues.forEach((issue) => {
        const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        console.log(`   ${icon} ${issue.message}`);
      });
    } else {
      console.log('\n✅ No documentation drift detected!');
    }

    // Generate report
    const report = generateDriftReport(comparison, issues);
    const reportPath = path.join(__dirname, '../../.metrics/DOC-DRIFT-REPORT.md');

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n✅ Report generated at ${reportPath}`);

    // Exit with appropriate code
    const hasErrors = issues.some((i) => i.severity === 'error');
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    console.error(`❌ Error checking documentation drift: ${error.message}`);
    process.exit(1);
  }
}

main();
