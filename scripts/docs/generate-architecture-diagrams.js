#!/usr/bin/env node

/**
 * Architecture Diagram Generator
 *
 * Auto-generates visual architecture diagrams from codebase structure
 * using Mermaid syntax for embedded markdown diagrams.
 *
 * Features:
 * - System architecture overview
 * - Handler organization hierarchy
 * - Service dependency graph
 * - Middleware pipeline visualization
 *
 * Output:
 * - docs/ARCHITECTURE-DIAGRAMS.md (with Mermaid diagrams)
 * - .metrics/ARCHITECTURE.json (machine-readable structure)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_PATH = path.join(process.cwd(), 'src');
const HANDLERS_PATH = path.join(SRC_PATH, 'app', 'handlers');
const SERVICES_PATH = path.join(SRC_PATH, 'core', 'services');
const MIDDLEWARE_PATH = path.join(SRC_PATH, 'app', 'middleware');
const DOCS_OUTPUT = path.join(process.cwd(), 'docs', 'ARCHITECTURE-DIAGRAMS.md');
const JSON_OUTPUT = path.join(process.cwd(), '.metrics', 'ARCHITECTURE.json');

// Data structures
const architecture = {
  timestamp: new Date().toISOString(),
  components: {
    handlers: {},
    services: [],
    middleware: [],
  },
  relationships: [],
};

/**
 * Scan handlers directory and categorize by type
 */
function scanHandlers() {
  const handlers = {};

  if (!fs.existsSync(HANDLERS_PATH)) {
    return handlers;
  }

  const categories = fs.readdirSync(HANDLERS_PATH, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  for (const category of categories) {
    const categoryPath = path.join(HANDLERS_PATH, category);
    const files = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
      .map(entry => entry.name.replace('.js', ''));

    handlers[category] = {
      path: `src/app/handlers/${category}`,
      count: files.length,
      files: files,
      displayName: category.charAt(0).toUpperCase() + category.slice(1),
    };
  }

  return handlers;
}

/**
 * Scan services directory
 */
function scanServices() {
  const services = [];

  if (!fs.existsSync(SERVICES_PATH)) {
    return services;
  }

  const files = fs.readdirSync(SERVICES_PATH, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => entry.name.replace('.js', ''));

  return files;
}

/**
 * Scan middleware directory
 */
function scanMiddleware() {
  const middleware = [];

  if (!fs.existsSync(MIDDLEWARE_PATH)) {
    return middleware;
  }

  const files = fs.readdirSync(MIDDLEWARE_PATH, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => entry.name.replace('.js', ''));

  return files;
}

/**
 * Generate system architecture overview diagram
 */
function generateSystemArchitectureDiagram() {
  const totalHandlers = Object.values(architecture.components.handlers)
    .reduce((sum, cat) => sum + cat.count, 0);

  return `graph TB
    subgraph Discord["🤖 Discord Bot Framework"]
        direction TB
        Bot["Discord.js Bot"]
    end

    subgraph Commands["📝 Command Layer"]
        direction TB
        Slash["Slash Commands"]
        Prefix["Prefix Commands"]
    end

    subgraph Handlers["🎯 Handler Layer"]
        direction TB
        H1["Admin Handlers<br/>(${architecture.components.handlers.admin?.count || 0})"]
        H2["Core Handlers<br/>(${architecture.components.handlers.core?.count || 0})"]
        H3["Messaging Handlers<br/>(${architecture.components.handlers.messaging?.count || 0})"]
        H4["Operations Handlers<br/>(${architecture.components.handlers.operations?.count || 0})"]
        H5["Quote Handlers<br/>(${architecture.components.handlers.quotes?.count || 0})"]
    end

    subgraph Services["🔧 Service Layer"]
        direction TB
        S1["Database Service"]
        S2["Quote Service"]
        S3["User Service"]
        S4["Analytics Service"]
        S5["Cache Service"]
    end

    subgraph Middleware["🔐 Middleware Pipeline"]
        direction TB
        M1["Authentication"]
        M2["Rate Limiting"]
        M3["Logging"]
        M4["Error Handling"]
    end

    subgraph Data["💾 Data Layer"]
        direction TB
        DB["SQLite Database"]
    end

    Discord --> Commands
    Commands --> Handlers
    Handlers --> Services
    Services --> Data
    Handlers --> Middleware
    Middleware --> Services

    style Discord fill:#e1f5ff
    style Commands fill:#f3e5f5
    style Handlers fill:#fff3e0
    style Services fill:#f1f8e9
    style Middleware fill:#fce4ec
    style Data fill:#ede7f6`;
}

/**
 * Generate handler organization diagram
 */
function generateHandlerOrganizationDiagram() {
  const diagram = `graph TD
    Handlers["👥 Handler Organization"]
    
    ${Object.entries(architecture.components.handlers).map(([key, data]) => {
      const files = data.files.slice(0, 3);
      const suffix = data.count > 3 ? `<br/>... +${data.count - 3} more` : '';
      return `${key}["${data.displayName} Handlers<br/>(${data.count} total)<br/><br/>${files.join('<br/>')}${suffix}"]`;
    }).join('\n    ')}

    Handlers --> admin
    Handlers --> core
    Handlers --> messaging
    Handlers --> operations
    Handlers --> quotes

    ${Object.keys(architecture.components.handlers).map((key) => {
      const colors = {
        admin: 'fill:#ff6b6b',
        core: 'fill:#4ecdc4',
        messaging: 'fill:#45b7d1',
        operations: 'fill:#f9ca24',
        quotes: 'fill:#6c5ce7',
      };
      return `style ${key} ${colors[key] || 'fill:#95a5a6'}, color:#fff`;
    }).join('\n    ')}

    style Handlers fill:#2c3e50, color:#fff`;

  return diagram;
}

/**
 * Generate service dependency diagram
 */
function generateServiceDependencyDiagram() {
  const services = architecture.components.services;

  return `graph LR
    subgraph Internal["Internal Services"]
        ${services.map(s => `S${services.indexOf(s)}["${s.charAt(0).toUpperCase() + s.slice(1)}"]`).join('\n        ')}
    end

    subgraph External["External Dependencies"]
        DB["Database"]
        Discord["Discord API"]
        Cache["Cache"]
    end

    ${services.map((s, i) => {
      const connections = [];
      if (s.includes('quote') || s.includes('database')) {
        connections.push('S' + i + ' --> DB');
      }
      if (s.includes('discord') || s.includes('user')) {
        connections.push('S' + i + ' --> Discord');
      }
      if (s.includes('cache')) {
        connections.push('S' + i + ' --> Cache');
      }
      return connections.join('\n    ');
    }).join('\n    ')}

    ${services.map((s, i) => `style S${i} fill:#f1f8e9, stroke:#558b2f, stroke-width:2px`).join('\n    ')}
    style DB fill:#ede7f6
    style Discord fill:#e1f5ff
    style Cache fill:#fff3e0`;
}

/**
 * Generate middleware pipeline diagram
 */
function generateMiddlewarePipelineDiagram() {
  const middleware = architecture.components.middleware;

  let diagram = 'graph LR\n    Input["Incoming Request"]';

  middleware.forEach((m, i) => {
    diagram += `\n    Input --> M${i}["${m.charAt(0).toUpperCase() + m.slice(1)}"]`;
    if (i < middleware.length - 1) {
      diagram += `\n    M${i} --> M${i + 1}`;
    } else {
      diagram += `\n    M${i} --> Handler["Handler Processing"]`;
      diagram += '\n    Handler --> Response["Response"]';
    }
  });

  middleware.forEach((m, i) => {
    const colors = {
      authentication: 'fill:#ff6b6b',
      'rate-limiting': 'fill:#4ecdc4',
      logging: 'fill:#45b7d1',
      'error-handling': 'fill:#f9ca24',
    };
    diagram += `\n    style M${i} ${colors[m] || 'fill:#95a5a6'}, color:#fff`;
  });

  diagram += '\n    style Input fill:#2c3e50, color:#fff\n    style Response fill:#27ae60, color:#fff';

  return diagram;
}

/**
 * Generate complete markdown document
 */
function generateMarkdownDocument() {
  const totalHandlers = Object.values(architecture.components.handlers)
    .reduce((sum, cat) => sum + cat.count, 0);

  let markdown = `# Architecture Diagrams

**Generated:** ${new Date().toLocaleString()}  
**Repository:** Rarsus/verabot  
**Branch:** feature/comprehensive-documentation-audit-and-modernization

---

## Architecture Overview

${architecture.components.handlers.admin ? '✅' : '❌'} **Handlers:** ${totalHandlers} total  
${architecture.components.services.length > 0 ? '✅' : '❌'} **Services:** ${architecture.components.services.length} total  
${architecture.components.middleware.length > 0 ? '✅' : '❌'} **Middleware:** ${architecture.components.middleware.length} components  

---

## System Architecture Overview

The following diagram shows the complete system architecture with all layers and their interactions:

\`\`\`mermaid
${generateSystemArchitectureDiagram()}
\`\`\`

### Architecture Layers

1. **Discord Bot Framework** - Discord.js integration and core bot functionality
2. **Command Layer** - Slash commands and prefix commands
3. **Handler Layer** - Event and command handlers organized by category
4. **Service Layer** - Business logic and data operations
5. **Middleware Pipeline** - Cross-cutting concerns (auth, logging, error handling)
6. **Data Layer** - SQLite database persistence

---

## Handler Organization

Handlers are organized into 5 categories based on their responsibilities:

\`\`\`mermaid
${generateHandlerOrganizationDiagram()}
\`\`\`

### Handler Categories

`;

  // Add detailed handler information
  for (const [category, data] of Object.entries(architecture.components.handlers)) {
    markdown += `#### ${data.displayName} (${data.count} handlers)\n\n`;
    markdown += `**Location:** \`${data.path}\`\n\n`;
    markdown += '**Files:**\n';
    data.files.forEach(file => {
      markdown += `- \`${file}.js\`\n`;
    });
    markdown += '\n';
  }

  markdown += `---

## Service Dependencies

Services provide business logic and data operations. The following diagram shows service relationships:

\`\`\`mermaid
${generateServiceDependencyDiagram()}
\`\`\`

### Services (${architecture.components.services.length})

`;

  architecture.components.services.forEach(service => {
    markdown += `- **${service.charAt(0).toUpperCase() + service.slice(1)}** - \`src/core/services/${service}.js\`\n`;
  });

  markdown += `
---

## Middleware Pipeline

Middleware components process requests and responses in the following pipeline:

\`\`\`mermaid
${generateMiddlewarePipelineDiagram()}
\`\`\`

### Middleware Components (${architecture.components.middleware.length})

`;

  architecture.components.middleware.forEach(mw => {
    markdown += `- **${mw.charAt(0).toUpperCase() + mw.slice(1)}** - \`src/app/middleware/${mw}.js\`\n`;
  });

  markdown += `
---

## Component Summary

| Component Type | Count | Percentage |
|---|---|---|
| Handlers | ${totalHandlers} | ${Math.round(totalHandlers / (totalHandlers + architecture.components.services.length + architecture.components.middleware.length) * 100)}% |
| Services | ${architecture.components.services.length} | ${Math.round(architecture.components.services.length / (totalHandlers + architecture.components.services.length + architecture.components.middleware.length) * 100)}% |
| Middleware | ${architecture.components.middleware.length} | ${Math.round(architecture.components.middleware.length / (totalHandlers + architecture.components.services.length + architecture.components.middleware.length) * 100)}% |
| **TOTAL** | **${totalHandlers + architecture.components.services.length + architecture.components.middleware.length}** | **100%** |

---

## Data Structures

### Handler Structure
\`\`\`json
{
  "category": {
    "path": "src/app/handlers/{category}",
    "count": 8,
    "files": ["file1", "file2", ...]
  }
}
\`\`\`

### Service Structure
\`\`\`json
{
  "services": ["service1", "service2", ...]
}
\`\`\`

### Middleware Structure
\`\`\`json
{
  "middleware": ["middleware1", "middleware2", ...]
}
\`\`\`

---

## Design Patterns Used

### Handler Pattern
- Organized by responsibility (admin, core, messaging, operations, quotes)
- Each handler encapsulates related functionality
- Clear separation of concerns

### Service Pattern
- Centralized business logic
- Reusable across handlers
- Dependency injection ready

### Middleware Pattern
- Pipeline-based processing
- Request/response modification
- Cross-cutting concerns

---

## Integration Points

- **Discord.js** - Bot framework and Discord API integration
- **Database Service** - SQLite persistence layer
- **Event Bus** - Internal message passing
- **Configuration** - Environment and settings management

---

## Guidelines

When adding new components:

1. **New Handler** - Add to appropriate category subdirectory in \`src/app/handlers/\`
2. **New Service** - Add to \`src/core/services/\` and register in service container
3. **New Middleware** - Add to \`src/app/middleware/\` and register in pipeline

This document is auto-generated. See \`scripts/docs/generate-architecture-diagrams.js\` for details.

---

**Last Updated:** ${new Date().toISOString()}  
**Version:** 1.0.0
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🏗️  Generating architecture diagrams...\n');

  try {
    // Scan codebase
    console.log('📂 Scanning codebase structure...');
    architecture.components.handlers = scanHandlers();
    architecture.components.services = scanServices();
    architecture.components.middleware = scanMiddleware();

    console.log(`   ✅ Found ${Object.values(architecture.components.handlers).reduce((sum, cat) => sum + cat.count, 0)} handlers`);
    console.log(`   ✅ Found ${architecture.components.services.length} services`);
    console.log(`   ✅ Found ${architecture.components.middleware.length} middleware components\n`);

    // Generate markdown
    console.log('📊 Generating diagrams...');
    const markdown = generateMarkdownDocument();

    // Ensure output directory exists
    const docsDir = path.dirname(DOCS_OUTPUT);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Write markdown file
    fs.writeFileSync(DOCS_OUTPUT, markdown);
    console.log(`   ✅ Created ${path.relative(process.cwd(), DOCS_OUTPUT)}`);

    // Ensure metrics directory exists
    const metricsDir = path.dirname(JSON_OUTPUT);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    // Write JSON file
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(architecture, null, 2));
    console.log(`   ✅ Created ${path.relative(process.cwd(), JSON_OUTPUT)}\n`);

    // Summary
    console.log('✅ Architecture diagrams generated successfully!');
    console.log('\n📄 Output Files:\n');
    console.log(`   📖 Documentation: ${path.relative(process.cwd(), DOCS_OUTPUT)}`);
    console.log(`   📊 Data: ${path.relative(process.cwd(), JSON_OUTPUT)}\n`);

  } catch (error) {
    console.error('❌ Error generating architecture diagrams:', error.message);
    process.exit(1);
  }
}

main();
