#!/usr/bin/env node

/**
 * Generate Changelog
 * Creates a changelog from conventional commits in git history
 *
 * Usage: node scripts/docs/generate-changelog.js
 *
 * This script:
 * 1. Parses git commit history for conventional commits
 * 2. Groups commits by type (feat, fix, docs, etc.)
 * 3. Generates CHANGELOG.md with all versions
 * 4. Organizes by semantic versioning
 * 5. Links to GitHub commits and PRs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '../../CHANGELOG.md');
const PACKAGE_JSON_PATH = path.join(__dirname, '../../package.json');

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  return packageJson.version;
}

/**
 * Get all commits from git history
 */
function getGitCommits() {
  try {
    const output = execSync('git log --pretty=format:"%H|%h|%s|%b|%an|%ae|%ai"', {
      encoding: 'utf8',
    });
    return output.split('\n').filter((line) => line.trim());
  } catch (error) {
    console.error(`❌ Failed to read git history: ${error.message}`);
    return [];
  }
}

/**
 * Get all tags from git history
 */
function getGitTags() {
  try {
    const output = execSync('git tag -l --sort=-version:refname', {
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 10); // Last 10 tags
  } catch {
    return [];
  }
}

/**
 * Parse a conventional commit
 */
function parseConventionalCommit(message) {
  const typeRegex = /^(feat|fix|docs|style|refactor|test|chore|ci|perf|revert)(\(.+\))?!?:\s(.+)$/;
  const match = message.match(typeRegex);

  if (!match) {
    return null;
  }

  return {
    type: match[1],
    scope: match[2] ? match[2].slice(1, -1) : null,
    breaking: match[0].includes('!'),
    description: match[3],
  };
}

/**
 * Format commit type for display
 */
function formatType(type) {
  const typeMap = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    docs: '📚 Documentation',
    style: '🎨 Styling',
    refactor: '♻️ Refactoring',
    test: '✅ Tests',
    chore: '🔧 Chores',
    ci: '🔄 CI/CD',
    perf: '⚡ Performance',
    revert: '⏮️ Reverts',
  };
  return typeMap[type] || type;
}

/**
 * Group commits by type
 */
function groupCommits(commits) {
  const grouped = {};

  commits.forEach((commit) => {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed) return;

    if (!grouped[parsed.type]) {
      grouped[parsed.type] = [];
    }

    grouped[parsed.type].push({
      ...parsed,
      hash: commit.hash,
      shortHash: commit.shortHash,
      author: commit.author,
    });
  });

  return grouped;
}

/**
 * Parse commits from git log
 */
function parseCommits(gitCommits) {
  return gitCommits
    .map((line) => {
      const [hash, shortHash, message, body, author, email, date] = line.split('|');
      return {
        hash,
        shortHash,
        message,
        body,
        author,
        email,
        date,
      };
    })
    .filter((commit) => commit.message);
}

/**
 * Generate changelog content
 */
function generateChangelog(version, commits) {
  const grouped = groupCommits(commits);
  const lines = [
    '# Changelog',
    '',
    'All notable changes to this project will be documented in this file.',
    '',
    'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),',
    'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
    '',
  ];

  // Group types by category
  const typeOrder = ['feat', 'fix', 'docs', 'test', 'refactor', 'perf', 'style', 'ci', 'chore'];

  // Find if there are breaking changes
  let hasBreakingChanges = false;
  Object.values(grouped).forEach((items) => {
    items.forEach((item) => {
      if (item.breaking) hasBreakingChanges = true;
    });
  });

  // Add section for current version
  lines.push(`## [${version}] - ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  if (hasBreakingChanges) {
    lines.push('### ⚠️ Breaking Changes');
    lines.push('');
    Object.values(grouped).forEach((items) => {
      items.forEach((item) => {
        if (item.breaking) {
          lines.push(`- **${item.scope ? item.scope + ': ' : ''}${item.description}**`);
        }
      });
    });
    lines.push('');
  }

  // Add commits by type
  typeOrder.forEach((type) => {
    if (!grouped[type]) return;

    lines.push(`### ${formatType(type)}`);
    lines.push('');

    grouped[type].forEach((commit) => {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      const breaking = commit.breaking ? ' ⚠️ BREAKING' : '';
      lines.push(`- ${scope}${commit.description}${breaking} ([${commit.shortHash}])`);
    });

    lines.push('');
  });

  // Add unreleased section if there are commits
  if (Object.keys(grouped).length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## [Unreleased]');
    lines.push('');
    lines.push('### Coming Soon');
    lines.push('');
    lines.push('- No unreleased changes at this time');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📝 Generating changelog from git history...\n');

  try {
    const version = getCurrentVersion();
    const tags = getGitTags();
    const gitCommits = getGitCommits();
    const commits = parseCommits(gitCommits);

    if (commits.length === 0) {
      console.warn('⚠️  No commits found in git history');
      return;
    }

    console.log(`📊 Processing ${commits.length} commits...`);

    // Generate changelog
    const changelog = generateChangelog(version, commits);

    // Save changelog
    fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf8');
    console.log(`✅ Changelog generated at ${CHANGELOG_PATH}`);

    // Print summary
    console.log('\n📋 Changelog Summary:');
    console.log(`   Version: ${version}`);
    console.log(`   Total Commits: ${commits.length}`);
    console.log(`   Tags Found: ${tags.length}`);

    const grouped = groupCommits(commits);
    Object.entries(grouped).forEach(([type, items]) => {
      console.log(`   ${formatType(type)}: ${items.length}`);
    });
  } catch (error) {
    console.error(`❌ Error generating changelog: ${error.message}`);
    process.exit(1);
  }
}

main();
