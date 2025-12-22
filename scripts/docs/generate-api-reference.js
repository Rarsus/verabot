#!/usr/bin/env node

/**
 * Generate API Reference
 * Extracts JSDoc comments from source code and generates API documentation
 *
 * Usage: node scripts/docs/generate-api-reference.js
 *
 * This script:
 * 1. Scans source code for JSDoc comments
 * 2. Extracts function, class, and method documentation
 * 3. Generates markdown API reference
 * 4. Updates docs/13-API-REFERENCE.md
 * 5. Maintains version and compatibility info
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '../../src');
const API_DOC_PATH = path.join(__dirname, '../../docs/13-API-REFERENCE.md');
const CORE_PATH = path.join(SRC_PATH, 'core');
const INFRA_PATH = path.join(SRC_PATH, 'infra');

/**
 * Find all JavaScript files in a directory
 */
function findJsFiles(directory) {
  const files = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  walkDir(directory);
  return files;
}

/**
 * Extract JSDoc comments from file content
 */
function extractJsDoc(content, filePath) {
  const docs = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for JSDoc start
    if (line.includes('/**')) {
      let jsDocBlock = '';
      let j = i;

      // Collect JSDoc block
      while (j < lines.length && !lines[j].includes('*/')) {
        jsDocBlock += lines[j] + '\n';
        j++;
      }

      if (j < lines.length) {
        jsDocBlock += lines[j]; // Include closing */
      }

      // Get the next non-comment line (the actual code)
      let k = j + 1;
      while (k < lines.length && lines[k].trim().startsWith('//')) {
        k++;
      }

      if (k < lines.length) {
        const codeLine = lines[k].trim();

        // Parse the JSDoc
        const parsed = parseJsDocBlock(jsDocBlock, codeLine, filePath);
        if (parsed) {
          docs.push(parsed);
        }
      }

      i = j;
    }
  }

  return docs;
}

/**
 * Parse a JSDoc block
 */
function parseJsDocBlock(jsDocBlock, codeLine, filePath) {
  // Extract description
  const descriptionMatch = jsDocBlock.match(/\/\*\*\s*\n\s*\*\s*(.+?)(?:\n|@)/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  // Extract params
  const paramMatches = [...jsDocBlock.matchAll(/@param\s+\{(.+?)\}\s+(\w+)\s*-?\s*(.+?)(?=\n|$)/g)];
  const params = paramMatches.map((match) => ({
    type: match[1].trim(),
    name: match[2].trim(),
    description: match[3].trim(),
  }));

  // Extract returns
  const returnsMatch = jsDocBlock.match(/@returns?\s+\{(.+?)\}\s*-?\s*(.+?)(?=\n|$)/);
  const returns = returnsMatch
    ? {
        type: returnsMatch[1].trim(),
        description: returnsMatch[2].trim(),
      }
    : null;

  // Extract name from code
  let name = '';
  let type;

  if (codeLine.includes('class ')) {
    const classMatch = codeLine.match(/class\s+(\w+)/);
    name = classMatch ? classMatch[1] : 'Unknown';
    type = 'class';
  } else if (codeLine.includes('function ')) {
    const funcMatch = codeLine.match(/function\s+(\w+)/);
    name = funcMatch ? funcMatch[1] : 'Unknown';
    type = 'function';
  } else if (codeLine.includes('= function') || codeLine.includes('= async function')) {
    const varMatch = codeLine.match(/(\w+)\s*=\s*(async\s+)?function/);
    name = varMatch ? varMatch[1] : 'Unknown';
    type = 'function';
  } else if (
    codeLine.includes('const ') ||
    codeLine.includes('let ') ||
    codeLine.includes('var ')
  ) {
    const varMatch = codeLine.match(/(const|let|var)\s+(\w+)/);
    name = varMatch ? varMatch[2] : 'Unknown';
    type = 'function';
  } else {
    return null;
  }

  if (!description) {
    return null;
  }

  return {
    name,
    type,
    description,
    params,
    returns,
    file: path.relative(SRC_PATH, filePath),
  };
}

/**
 * Group APIs by category
 */
function groupAPIs(docs) {
  const grouped = {
    core: {
      commands: [],
      services: [],
      errors: [],
    },
    infra: {
      config: [],
      database: [],
      discord: [],
      logging: [],
      metrics: [],
      queue: [],
      websocket: [],
    },
    app: {
      handlers: [],
      middleware: [],
    },
  };

  docs.forEach((doc) => {
    if (doc.file.includes('core/commands')) {
      grouped.core.commands.push(doc);
    } else if (doc.file.includes('core/services')) {
      grouped.core.services.push(doc);
    } else if (doc.file.includes('core/errors')) {
      grouped.core.errors.push(doc);
    } else if (doc.file.includes('infra/config')) {
      grouped.infra.config.push(doc);
    } else if (doc.file.includes('infra/db')) {
      grouped.infra.database.push(doc);
    } else if (doc.file.includes('infra/discord')) {
      grouped.infra.discord.push(doc);
    } else if (doc.file.includes('infra/logging')) {
      grouped.infra.logging.push(doc);
    } else if (doc.file.includes('infra/metrics')) {
      grouped.infra.metrics.push(doc);
    } else if (doc.file.includes('infra/queue')) {
      grouped.infra.queue.push(doc);
    } else if (doc.file.includes('infra/ws')) {
      grouped.infra.websocket.push(doc);
    } else if (doc.file.includes('app/handlers')) {
      grouped.app.handlers.push(doc);
    } else if (doc.file.includes('app/middleware')) {
      grouped.app.middleware.push(doc);
    }
  });

  return grouped;
}

/**
 * Generate markdown for an API
 */
function generateAPIMarkdown(doc) {
  const lines = [
    `### \`${doc.name}\``,
    '',
    `**Type:** ${doc.type}`,
    `**File:** \`${doc.file}\``,
    '',
    doc.description,
    '',
  ];

  if (doc.params.length > 0) {
    lines.push('**Parameters:**');
    lines.push('');
    lines.push('| Name | Type | Description |');
    lines.push('|------|------|-------------|');
    doc.params.forEach((param) => {
      lines.push(`| \`${param.name}\` | \`${param.type}\` | ${param.description} |`);
    });
    lines.push('');
  }

  if (doc.returns) {
    lines.push('**Returns:**');
    lines.push('');
    lines.push(`- **Type:** \`${doc.returns.type}\``);
    lines.push(`- **Description:** ${doc.returns.description}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate complete API reference
 */
function generateCompleteAPIReference(grouped) {
  const lines = [
    '# API Reference',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    'This is an auto-generated API reference. For more details, see the source code JSDoc comments.',
    '',
    '## Table of Contents',
    '',
    '- [Core](#core)',
    '  - [Commands](#commands)',
    '  - [Services](#services)',
    '  - [Errors](#errors)',
    '- [Infrastructure](#infrastructure)',
    '  - [Configuration](#configuration)',
    '  - [Database](#database)',
    '  - [Discord Integration](#discord-integration)',
    '  - [Logging](#logging)',
    '  - [Metrics](#metrics)',
    '  - [Job Queue](#job-queue)',
    '  - [WebSocket](#websocket)',
    '- [Application](#application)',
    '  - [Handlers](#handlers)',
    '  - [Middleware](#middleware)',
    '',
  ];

  // Core APIs
  lines.push('## Core');
  lines.push('');

  if (grouped.core.commands.length > 0) {
    lines.push('### Commands');
    lines.push('');
    grouped.core.commands.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.core.services.length > 0) {
    lines.push('### Services');
    lines.push('');
    grouped.core.services.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.core.errors.length > 0) {
    lines.push('### Errors');
    lines.push('');
    grouped.core.errors.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  // Infrastructure APIs
  lines.push('## Infrastructure');
  lines.push('');

  if (grouped.infra.config.length > 0) {
    lines.push('### Configuration');
    lines.push('');
    grouped.infra.config.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.database.length > 0) {
    lines.push('### Database');
    lines.push('');
    grouped.infra.database.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.discord.length > 0) {
    lines.push('### Discord Integration');
    lines.push('');
    grouped.infra.discord.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.logging.length > 0) {
    lines.push('### Logging');
    lines.push('');
    grouped.infra.logging.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.metrics.length > 0) {
    lines.push('### Metrics');
    lines.push('');
    grouped.infra.metrics.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.queue.length > 0) {
    lines.push('### Job Queue');
    lines.push('');
    grouped.infra.queue.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.infra.websocket.length > 0) {
    lines.push('### WebSocket');
    lines.push('');
    grouped.infra.websocket.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  // Application APIs
  lines.push('## Application');
  lines.push('');

  if (grouped.app.handlers.length > 0) {
    lines.push('### Handlers');
    lines.push('');
    grouped.app.handlers.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  if (grouped.app.middleware.length > 0) {
    lines.push('### Middleware');
    lines.push('');
    grouped.app.middleware.forEach((doc) => {
      lines.push(generateAPIMarkdown(doc));
    });
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📖 Generating API reference from JSDoc...\n');

  try {
    // Find all JS files
    const coreFiles = findJsFiles(CORE_PATH);
    const infraFiles = findJsFiles(INFRA_PATH);
    const allFiles = [...coreFiles, ...infraFiles];

    console.log(`Found ${allFiles.length} source files`);

    // Extract JSDoc from all files
    let allDocs = [];
    allFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const docs = extractJsDoc(content, file);
      allDocs = allDocs.concat(docs);
    });

    console.log(`📚 Extracted ${allDocs.length} API items`);

    // Group APIs
    const grouped = groupAPIs(allDocs);

    // Generate markdown
    const markdown = generateCompleteAPIReference(grouped);

    // Save API reference
    fs.writeFileSync(API_DOC_PATH, markdown, 'utf8');
    console.log(`✅ API reference generated at ${API_DOC_PATH}`);

    // Print summary
    console.log('\n📊 API Reference Summary:');
    console.log(`   Total APIs Documented: ${allDocs.length}`);
    console.log(
      `   Core APIs: ${grouped.core.commands.length + grouped.core.services.length + grouped.core.errors.length}`,
    );
    console.log(
      `   Infrastructure APIs: ${
        grouped.infra.config.length +
        grouped.infra.database.length +
        grouped.infra.discord.length +
        grouped.infra.logging.length +
        grouped.infra.metrics.length +
        grouped.infra.queue.length +
        grouped.infra.websocket.length
      }`,
    );
    console.log(
      `   Application APIs: ${grouped.app.handlers.length + grouped.app.middleware.length}`,
    );
  } catch (error) {
    console.error(`❌ Error generating API reference: ${error.message}`);
    process.exit(1);
  }
}

main();
