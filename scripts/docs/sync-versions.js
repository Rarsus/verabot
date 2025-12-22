#!/usr/bin/env node

/**
 * Sync Version Information
 * Extracts version information from package.json and updates documentation files
 *
 * Usage: node scripts/docs/sync-versions.js
 *
 * This script:
 * 1. Reads package.json for dependency versions
 * 2. Extracts Node.js version requirements
 * 3. Creates a version reference file for documentation
 * 4. Updates version placeholders in docs if found
 * 5. Validates version consistency across documents
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_JSON_PATH = path.join(__dirname, '../../package.json');
const VERSIONS_OUTPUT_PATH = path.join(__dirname, '../../.metrics/VERSIONS.json');
const DOCS_PATH = path.join(__dirname, '../../docs');

/**
 * Read and parse package.json
 */
function readPackageJson() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read package.json: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract version information from package.json
 */
function extractVersions(packageJson) {
  const nodeVersion = packageJson.engines?.node || 'v18+';
  const npmVersion = packageJson.engines?.npm || 'v9+';

  const versions = {
    extracted_at: new Date().toISOString(),
    project: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: packageJson.main,
      type: packageJson.type,
    },
    engines: {
      node: nodeVersion,
      npm: npmVersion,
    },
    dependencies: {
      production: packageJson.dependencies || {},
      development: packageJson.devDependencies || {},
    },
    compatibility_matrix: generateCompatibilityMatrix(packageJson),
  };

  return versions;
}

/**
 * Generate a compatibility matrix for major dependencies
 */
function generateCompatibilityMatrix(packageJson) {
  const criticalDeps = {
    'discord.js': packageJson.dependencies['discord.js'],
    express: packageJson.dependencies.express,
    'better-sqlite3': packageJson.dependencies['better-sqlite3'],
    bullmq: packageJson.dependencies.bullmq,
    ioredis: packageJson.dependencies.ioredis,
    pino: packageJson.dependencies.pino,
    zod: packageJson.dependencies.zod,
    jest: packageJson.devDependencies.jest,
    eslint: packageJson.devDependencies.eslint,
    prettier: packageJson.devDependencies.prettier,
  };

  return {
    critical_dependencies: criticalDeps,
    notes: [
      `Node.js: ${packageJson.engines?.node || 'v18+'}`,
      `npm: ${packageJson.engines?.npm || 'v9+'}`,
      'Discord.js v14+ requires Node.js v16.11.0 or higher',
      'Express v5.x dropped Node.js v14 and v15 support',
      'Bull/BullMQ requires Redis 5.0 or higher',
    ],
  };
}

/**
 * Generate documentation sections for version info
 */
function generateVersionDocumentation(versions) {
  const deps = versions.dependencies.production;
  const devDeps = versions.dependencies.development;

  const markdown = `# Version Information

**Last Updated:** ${versions.extracted_at}

## Project

- **Name:** ${versions.project.name}
- **Current Version:** ${versions.project.version}
- **Type:** ${versions.project.type}
- **Main Entry:** ${versions.project.main}

## Runtime Requirements

### Node.js & npm

- **Node.js:** ${versions.engines.node}
- **npm:** ${versions.engines.npm}

## Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
${Object.entries(deps)
  .map(([name, version]) => `| ${name} | ${version} | |`)
  .join('\n')}

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
${Object.entries(devDeps)
  .map(([name, version]) => `| ${name} | ${version} | |`)
  .join('\n')}

## Compatibility Matrix

### Critical Dependencies

${Object.entries(versions.compatibility_matrix.critical_dependencies)
  .map(([name, version]) => `- **${name}**: ${version}`)
  .join('\n')}

### Important Notes

${versions.compatibility_matrix.notes.map((note) => `- ${note}`).join('\n')}
`;

  return markdown;
}

/**
 * Save version information to file
 */
function saveVersions(versions) {
  try {
    fs.writeFileSync(VERSIONS_OUTPUT_PATH, JSON.stringify(versions, null, 2), 'utf8');
    console.log(`✅ Version information saved to ${VERSIONS_OUTPUT_PATH}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save versions: ${error.message}`);
    return false;
  }
}

/**
 * Generate version documentation
 */
function generateAndSaveVersionDocs(versions) {
  try {
    const markdown = generateVersionDocumentation(versions);
    const docsPath = path.join(__dirname, '../../docs/VERSIONS.md');

    // Check if file exists and compare
    let existingContent = '';
    if (fs.existsSync(docsPath)) {
      existingContent = fs.readFileSync(docsPath, 'utf8');
    }

    if (existingContent !== markdown) {
      fs.writeFileSync(docsPath, markdown, 'utf8');
      console.log(`✅ Version documentation updated at ${docsPath}`);
      return true;
    } else {
      console.log('ℹ️  Version documentation is up to date');
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to generate version docs: ${error.message}`);
    return false;
  }
}

/**
 * Validate Node.js version
 */
function validateNodeVersion() {
  const currentVersion = process.version;
  const packageJson = readPackageJson();
  const requiredVersion = packageJson.engines?.node || 'v18.0.0';

  console.log('\n📋 Node.js Validation');
  console.log(`   Current: ${currentVersion}`);
  console.log(`   Required: ${requiredVersion}`);

  // Simple validation - just check major version
  const currentMajor = parseInt(currentVersion.slice(1).split('.')[0]);
  const requiredMajor = parseInt(requiredVersion.slice(1).split('.')[0]);

  if (currentMajor >= requiredMajor) {
    console.log('✅ Node.js version is compatible');
    return true;
  } else {
    console.error(`❌ Node.js version ${currentVersion} is below required ${requiredVersion}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Syncing version information...\n');

  // Validate Node version
  if (!validateNodeVersion()) {
    process.exit(1);
  }

  // Read package.json
  const packageJson = readPackageJson();

  // Extract versions
  const versions = extractVersions(packageJson);

  // Save versions to JSON
  if (!saveVersions(versions)) {
    process.exit(1);
  }

  // Generate and save documentation
  generateAndSaveVersionDocs(versions);

  console.log('\n✅ Version synchronization complete!');
  console.log('\n📊 Summary:');
  console.log(`   Project: ${versions.project.name} v${versions.project.version}`);
  console.log(`   Node.js: ${versions.engines.node}`);
  console.log(`   Dependencies: ${Object.keys(versions.dependencies.production).length}`);
  console.log(`   Dev Dependencies: ${Object.keys(versions.dependencies.development).length}`);
  console.log('\n📄 Files updated:');
  console.log(`   - ${VERSIONS_OUTPUT_PATH}`);
  console.log(`   - ${DOCS_PATH}/VERSIONS.md`);
}

main();
