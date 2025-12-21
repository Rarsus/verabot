# 1. Installation & Setup

Learn how to install, configure, and run VeraBot locally.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Discord Bot Setup](#discord-bot-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running the Bot](#running-the-bot)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Redis:** v6.0.0+ (for job queue and caching)
- **SQLite:** v3.x (included with better-sqlite3)

### Optional
- **Docker:** For containerized deployment
- **Git:** For cloning the repository

### Hardware
- **Minimum:** 512MB RAM, 100MB disk space
- **Recommended:** 2GB RAM, 500MB disk space

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Rarsus/verabot.git
cd verabot
```

### 2. Install Dependencies

```bash
npm install
```

This will install all production and development dependencies from `package.json`:
- Discord.js v14 - Discord API client
- BullMQ - Job queue system
- Express - HTTP server for metrics/admin
- SQLite - Local database
- Pino - Logging
- Redis client - For queue backend

### 3. Create Environment File

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create a new `.env` file in the project root.

### 4. Verify Installation

```bash
npm test
npm run test:coverage
```

Expected result: 351+ tests passing, 47%+ coverage.

---

## Discord Bot Setup

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter a name (e.g., "VeraBot")
4. Accept Terms and Create

### 2. Create a Bot User

1. Go to "Bot" section
2. Click "Add Bot"
3. Under TOKEN, click "Copy"
4. Save this token securely (don't share!)

### 3. Set Bot Permissions

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
   - `applications.commands` (for slash commands)
3. Select permissions:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `Add Reactions`
   - `Use Application Commands`
4. Copy the generated URL and open it to invite the bot to your server

### 4. Configure Application Commands

1. Go to "General Information"
2. Copy the **APPLICATION ID**
3. Add both to your `.env` file

---

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Discord Configuration (Required)
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here

# Redis Configuration (Required for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Optional Configuration
NODE_ENV=development
LOG_LEVEL=info
GUILD_ID=optional_test_guild_id_for_faster_registration
```

### Environment Variables Explained

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DISCORD_TOKEN` | Yes | - | Bot authentication token from Discord |
| `CLIENT_ID` | Yes | - | Application ID from Discord Developer Portal |
| `REDIS_HOST` | Yes | localhost | Redis server hostname |
| `REDIS_PORT` | Yes | 6379 | Redis server port |
| `REDIS_PASSWORD` | No | - | Redis authentication password |
| `NODE_ENV` | No | development | Environment mode (development/production) |
| `LOG_LEVEL` | No | info | Logging level (debug/info/warn/error) |
| `GUILD_ID` | No | - | Discord guild ID for faster slash command registration |

See [Environment Configuration](./3-ENVIRONMENT-CONFIG.md) for detailed explanations.

---

## Database Setup

### SQLite (Local Database)

The bot uses SQLite for local data storage. The database is created automatically:

```bash
npm start
```

This will:
1. Create `database.db` if it doesn't exist
2. Initialize schema on first run
3. Create necessary tables automatically

**Database Location:** `./database.db` (in project root)

### Initialize Manually (Optional)

```bash
node src/schema-enhancement.js
```

This script:
- Creates all necessary tables
- Sets up indexes
- Configures constraints

---

## Running the Bot

### Development Mode

```bash
npm start
```

The bot will:
1. Connect to Discord
2. Register slash commands
3. Start listening for messages
4. Initialize job queue
5. Start HTTP servers for health/metrics

**Expected Output:**
```
[timestamp] INFO: Bot connected as @VeraBot#1234
[timestamp] INFO: Listening to 45 commands
[timestamp] INFO: Job queue initialized
[timestamp] INFO: Health metrics server on port 3000
```

### Watch Mode (For Development)

```bash
npm run test:watch
```

Automatically reruns tests when files change.

### With Logging

Adjust log level in `.env`:
```env
LOG_LEVEL=debug
```

Debug output shows all command execution details.

---

## Verification

### Test Suite

Verify everything works:

```bash
npm test
```

Expected: All tests pass (351+ tests)

### Test Coverage

Check test coverage:

```bash
npm run test:coverage
```

Expected: 47%+ coverage (targeting 70%)

### Health Check

Once running, check bot health:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-12-21T10:00:00Z"
}
```

### Command Registration

The bot automatically registers all slash commands on startup. Check Discord by:
1. Type `/` in your server
2. You should see all available commands
3. Try `/ping` - should respond with "Pong!"

---

## Troubleshooting

### Common Issues

#### "DISCORD_TOKEN not found"
- **Cause:** `.env` file missing or doesn't contain DISCORD_TOKEN
- **Solution:** Create `.env` file with DISCORD_TOKEN from Discord Developer Portal

#### "Cannot connect to Redis"
- **Cause:** Redis server not running
- **Solution:** Start Redis:
  ```bash
  redis-server
  ```
  Or run with Docker:
  ```bash
  docker run -d -p 6379:6379 redis
  ```

#### "Port 3000 already in use"
- **Cause:** Another process using the health metrics port
- **Solution:** Change port in code or kill the process:
  ```bash
  lsof -i :3000  # Find process
  kill -9 <PID>  # Kill it
  ```

#### "Command not appearing in Discord"
- **Cause:** Bot doesn't have permissions or commands not registered
- **Solution:**
  1. Verify bot has "Use Application Commands" permission
  2. Restart bot: `npm start`
  3. Wait 5-10 seconds for registration
  4. Refresh Discord (`Ctrl+R`)

#### "Database locked error"
- **Cause:** Multiple instances accessing SQLite simultaneously
- **Solution:** Only run one bot instance, or use different database files

### Getting Help

1. Check [Troubleshooting Guide](./20-TROUBLESHOOTING.md)
2. Review logs: Set `LOG_LEVEL=debug` in `.env`
3. Check [FAQ](./22-FAQ.md)
4. Review [Resources](./23-RESOURCES.md)

---

## What's Next?

- ✅ Installation complete
- 📖 Read [Quick Start Guide](./2-QUICK-START.md) to get running
- 🎮 See [User Manual](./4-USER-MANUAL.md) to use the bot
- 🏗️ Review [Architecture](./7-ARCHITECTURE.md) to understand the codebase

---

**Next:** [Quick Start Guide](./2-QUICK-START.md)
