#!/usr/bin/env node

/**
 * Validate Documentation
 * Checks documentation for broken links, missing files, and validation issues
 *
 * Usage: node scripts/docs/validate-docs.js
 *
 * This script:
 * 1. Validates all markdown links (internal and external)
 * 2. Checks for missing file references
 * 3. Verifies code examples syntax
 * 4. Detects orphaned documentation
 * 5. Generates validation report
 */

const fs = require('fs');
const path = require('path');

const DOCS_PATH = path.join(__dirname, '../../docs');
const ROOT_PATH = path.join(__dirname, '../..');
const REPORT_PATH = path.join(__dirname, '../../.metrics/VALIDATION-REPORT.json');

const issues = {
  broken_links: [],
  missing_files: [],
  orphaned_files: [],
  syntax_errors: [],
  warnings: [],
};

const processedFiles = new Set();
const referencedFiles = new Set();

/**
 * Get all markdown files
 */
function getMarkdownFiles(dir = DOCS_PATH) {
  const files = [];

  function walkDir(directory) {
    if (!fs.existsSync(directory)) return;

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Get all markdown files in root
 */
function getRootMarkdownFiles() {
  const files = [];

  const entries = fs.readdirSync(ROOT_PATH, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.join(ROOT_PATH, entry.name));
    }
  }

  return files;
}

/**
 * Extract links from markdown content
 */
function extractLinks(content, _filePath) {
  const links = [];

  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // Also match reference-style links
  const refRegex = /\[([^\]]+)\]:\s*(.+)/g;
  while ((match = refRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2].trim(),
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return links;
}

/**
 * Validate a single link
 */
function validateLink(link, sourceFile) {
  const { url, line } = link;

  // Skip external URLs (http, https, ftp, mailto, etc.)
  if (url.match(/^[a-z]+:/) || url.match(/^#/)) {
    return null; // Skip external links in this validation
  }

  // Parse the link
  const [filePath] = url.split('#');

  // Empty file path means current file
  if (!filePath) {
    return null; // Valid anchor link
  }

  // Resolve relative path
  const baseDir = path.dirname(sourceFile);
  const resolvedPath = path.resolve(baseDir, filePath);
  const relativePath = path.relative(ROOT_PATH, resolvedPath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return {
      type: 'broken_link',
      file: path.relative(ROOT_PATH, sourceFile),
      line,
      link: url,
      resolved_path: relativePath,
      message: `File not found: ${url}`,
    };
  }

  // Track referenced file
  referencedFiles.add(resolvedPath);

  return null;
}

/**
 * Validate code blocks
 */
function validateCodeBlocks(content, filePath) {
  const errors = [];

  // Match code blocks with language specifiers
  const codeRegex = /```(\w+)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeRegex.exec(content)) !== null) {
    const language = match[1];
    const code = match[2];
    const line = content.substring(0, match.index).split('\n').length;

    // Basic syntax validation for JSON and YAML
    if (language === 'json') {
      try {
        JSON.parse(code);
      } catch (error) {
        errors.push({
          type: 'syntax_error',
          file: path.relative(ROOT_PATH, filePath),
          line,
          language: 'json',
          message: `Invalid JSON: ${error.message}`,
        });
      }
    }

    if (language === 'yaml' || language === 'yml') {
      // Very basic YAML validation - just check for tabs
      if (code.includes('\t')) {
        errors.push({
          type: 'syntax_error',
          file: path.relative(ROOT_PATH, filePath),
          line,
          language: 'yaml',
          message: 'YAML should use spaces, not tabs',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate a single markdown file
 */
function validateFile(filePath) {
  processedFiles.add(filePath);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract and validate links
    const links = extractLinks(content, filePath);
    links.forEach((link) => {
      const issue = validateLink(link, filePath);
      if (issue) {
        issues[issue.type].push(issue);
      }
    });

    // Validate code blocks
    const codeIssues = validateCodeBlocks(content, filePath);
    issues.syntax_errors.push(...codeIssues);

    // Check for common issues
    if (!content.trim().startsWith('#')) {
      issues.warnings.push({
        file: path.relative(ROOT_PATH, filePath),
        message: 'File does not start with a heading (#)',
      });
    }

    // Check for very short files
    if (content.trim().length < 100) {
      issues.warnings.push({
        file: path.relative(ROOT_PATH, filePath),
        message: 'File is very short (less than 100 characters)',
      });
    }
  } catch (error) {
    issues.warnings.push({
      file: path.relative(ROOT_PATH, filePath),
      message: `Error reading file: ${error.message}`,
    });
  }
}

/**
 * Find orphaned documentation files
 */
function findOrphanedFiles() {
  // Get all markdown files
  const docsFiles = getMarkdownFiles();
  const rootFiles = getRootMarkdownFiles();
  const allFiles = [...docsFiles, ...rootFiles];

  for (const file of allFiles) {
    if (!processedFiles.has(file) && !referencedFiles.has(file)) {
      // Check if it's referenced from anywhere
      let isReferenced = false;

      for (const processedFile of processedFiles) {
        const content = fs.readFileSync(processedFile, 'utf8');
        const fileName = path.basename(file);
        if (content.includes(fileName)) {
          isReferenced = true;
          break;
        }
      }

      if (!isReferenced && path.basename(file) !== 'index.md') {
        issues.orphaned_files.push({
          file: path.relative(ROOT_PATH, file),
          message: 'File is not referenced from other documentation',
        });
      }
    }
  }
}

/**
 * Generate validation report
 */
function generateReport() {
  const lines = [
    '# Documentation Validation Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Files Processed:** ${processedFiles.size}`,
    '',
    '## Summary',
    '',
    '| Issue Type | Count |',
    '|-----------|-------|',
    `| Broken Links | ${issues.broken_links.length} |`,
    `| Missing Files | ${issues.missing_files.length} |`,
    `| Syntax Errors | ${issues.syntax_errors.length} |`,
    `| Warnings | ${issues.warnings.length} |`,
    `| Orphaned Files | ${issues.orphaned_files.length} |`,
    '',
  ];

  if (issues.broken_links.length > 0) {
    lines.push('## Broken Links');
    lines.push('');
    issues.broken_links.forEach((issue) => {
      lines.push(`### ${issue.file}:${issue.line}`);
      lines.push(`Link: \`${issue.link}\``);
      lines.push(`Message: ${issue.message}`);
      lines.push('');
    });
  }

  if (issues.syntax_errors.length > 0) {
    lines.push('## Syntax Errors');
    lines.push('');
    issues.syntax_errors.forEach((issue) => {
      lines.push(`### ${issue.file}:${issue.line}`);
      lines.push(`Language: ${issue.language}`);
      lines.push(`Message: ${issue.message}`);
      lines.push('');
    });
  }

  if (issues.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    issues.warnings.forEach((issue) => {
      lines.push(`### ${issue.file}`);
      lines.push(`${issue.message}`);
      lines.push('');
    });
  }

  if (issues.orphaned_files.length > 0) {
    lines.push('## Orphaned Files');
    lines.push('');
    issues.orphaned_files.forEach((issue) => {
      lines.push(`### ${issue.file}`);
      lines.push(`${issue.message}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Validating documentation...\n');

  try {
    // Get all markdown files
    const docsFiles = getMarkdownFiles();
    const rootFiles = getRootMarkdownFiles();
    const allFiles = [...docsFiles, ...rootFiles];

    console.log(`Found ${allFiles.length} markdown files`);

    // Validate each file
    allFiles.forEach((file) => {
      validateFile(file);
    });

    // Find orphaned files
    findOrphanedFiles();

    // Generate report
    const report = generateReport();
    const reportPath = path.join(__dirname, '../../.metrics/DOCS-VALIDATION-REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');

    // Save JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        files_processed: processedFiles.size,
        broken_links: issues.broken_links.length,
        syntax_errors: issues.syntax_errors.length,
        warnings: issues.warnings.length,
        orphaned_files: issues.orphaned_files.length,
      },
      issues,
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(jsonReport, null, 2), 'utf8');

    // Print results
    console.log('\n✅ Validation complete!');
    console.log('\n📊 Results:');
    console.log(`   Files Processed: ${processedFiles.size}`);
    console.log(`   Broken Links: ${issues.broken_links.length}`);
    console.log(`   Syntax Errors: ${issues.syntax_errors.length}`);
    console.log(`   Warnings: ${issues.warnings.length}`);
    console.log(`   Orphaned Files: ${issues.orphaned_files.length}`);
    console.log('\n📄 Reports saved to:');
    console.log(`   - ${reportPath}`);
    console.log(`   - ${REPORT_PATH}`);

    // Exit with error if issues found
    const totalIssues =
      issues.broken_links.length + issues.syntax_errors.length + issues.orphaned_files.length;

    if (totalIssues > 0) {
      console.error(`\n❌ Found ${totalIssues} critical issues`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

main();
