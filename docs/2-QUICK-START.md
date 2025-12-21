# 2. Quick Start Guide

Get VeraBot up and running in 5 minutes.

---

## ⚡ 5-Minute Quickstart

### Step 1: Prerequisites (1 minute)
- Node.js 18+
- Discord application with bot token
- Redis running locally

### Step 2: Clone & Install (2 minutes)

```bash
git clone https://github.com/Rarsus/verabot.git
cd verabot
npm install
```

### Step 3: Configure (1 minute)

Create `.env` file:

```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_app_id_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 4: Run (1 minute)

```bash
npm start
```

Expected output:
```
[INFO] Bot connected as @VeraBot
[INFO] Listening to 45 commands
[INFO] Job queue initialized
```

**Done!** The bot is running and commands are available in Discord.

---

## 🧪 Verify Installation

### Test Commands in Discord

1. Type `/` in your Discord server
2. Try `/ping` → should respond "Pong!"
3. Try `/info` → shows bot information
4. Try `/stats` → shows command statistics

### Run Test Suite

```bash
npm test
```

Expected: 351+ tests passing

---

## 📁 Project Structure

```
verabot/
├── src/
│   ├── app/           # Command handlers and middleware
│   ├── core/          # Core command logic and services
│   ├── infra/         # Infrastructure (DB, queues, Discord)
│   └── interfaces/    # HTTP/WebSocket endpoints
├── tests/             # Test suites
├── docs/              # Documentation (you are here)
├── .env               # Configuration
└── package.json       # Dependencies
```

Key directories:
- **`src/app/handlers/`** - All command implementations
- **`src/core/`** - Core architecture (Command, Registry, Services)
- **`src/infra/`** - Database, job queue, Discord integration
- **`tests/`** - Jest test suites

---

## 🎯 Common Tasks

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode (auto-rerun on changes)
npm run test:coverage      # Generate coverage report
npm run test:unit          # Only unit tests
npm run test:integration   # Only integration tests
```

### View Logs
```bash
# Set log level in .env
LOG_LEVEL=debug npm start
```

### View Metrics
```bash
curl http://localhost:3000/health    # Health check
curl http://localhost:3000/metrics   # Performance metrics
```

### Monitor Job Queue
Navigate to: `http://localhost:3002/admin/queues`

(Bull Board admin UI for job queue management)

---

## 🔧 Development Workflow

### 1. Make Changes

Edit files in `src/`:
```javascript
// Example: src/app/handlers/core/PingHandler.js
class PingHandler {
  handle(command) {
    return 'Pong!';
  }
}
```

### 2. Run Tests

```bash
npm test
```

### 3. Verify Coverage

```bash
npm run test:coverage
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new command"
git push
```

---

## 📚 Next Steps

### For Users
- [User Manual](./4-USER-MANUAL.md) - How to use the bot
- [Command Reference](./5-COMMAND-REFERENCE.md) - All available commands

### For Developers
- [Architecture Guide](./7-ARCHITECTURE.md) - System design
- [Adding Commands](./14-ADDING-COMMANDS.md) - Create new commands
- [Testing Guide](./15-TESTING.md) - Write tests
- [Best Practices](./12-BEST-PRACTICES.md) - Coding standards

### For Operations
- [Deployment](./18-DEPLOYMENT.md) - Production setup
- [Monitoring](./19-MONITORING.md) - Health and metrics
- [Troubleshooting](./20-TROUBLESHOOTING.md) - Common issues

---

## 🆘 Stuck?

| Problem | Solution |
|---------|----------|
| `DISCORD_TOKEN not found` | Add to `.env` file |
| `Cannot connect to Redis` | Start Redis: `redis-server` |
| Tests failing | Run `npm install` and `npm test` again |
| Commands not appearing | Restart bot and refresh Discord |

See [Troubleshooting Guide](./20-TROUBLESHOOTING.md) for more help.

---

## 📖 Documentation Map

- **[Home](./README.md)** - Documentation index
- **[Installation](./1-GETTING-STARTED.md)** - Detailed setup
- **[User Manual](./4-USER-MANUAL.md)** - Using the bot
- **[Command Reference](./5-COMMAND-REFERENCE.md)** - All commands
- **[Architecture](./7-ARCHITECTURE.md)** - System design
- **[Development](./11-DEVELOPMENT.md)** - Dev setup
- **[Testing](./15-TESTING.md)** - Writing tests
- **[Troubleshooting](./20-TROUBLESHOOTING.md)** - Common issues

---

**Next:** [User Manual](./4-USER-MANUAL.md) or [Development Guide](./11-DEVELOPMENT.md)
