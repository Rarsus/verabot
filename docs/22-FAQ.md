# 22. FAQ

Frequently Asked Questions about VeraBot.

---

## General

### What is VeraBot?

VeraBot (WS Discord Enterprise Bot) is a feature-rich Discord bot providing administrative tools, command execution, job queue management, and system monitoring capabilities. It's built with modern architecture, comprehensive testing, and enterprise-grade reliability.

### What are the main features?

- **Command Execution** - Slash and prefix commands with permission control
- **Permission Management** - Fine-grained role/channel/user-based access
- **Job Queue** - Background job processing with BullMQ
- **WebSocket API** - Direct command execution over WebSocket
- **Health Monitoring** - Real-time health checks and metrics
- **Audit Logging** - Complete audit trail of all operations
- **Admin UI** - Bull Board for job queue management

### Who should use VeraBot?

- Discord server administrators
- Team leads managing bot deployment
- Developers extending the bot
- Operations teams monitoring systems

### Is VeraBot open source?

Yes! VeraBot is open source on GitHub at `https://github.com/Rarsus/verabot`.

---

## Installation & Setup

### How do I install VeraBot?

Follow the [Installation & Setup](./1-GETTING-STARTED.md) guide:

```bash
git clone https://github.com/Rarsus/verabot.git
cd verabot
npm install
npm start
```

### What are the system requirements?

- Node.js 18 or higher
- npm 9 or higher
- Redis 6.0 or higher
- SQLite (included)
- 512MB RAM minimum

### Where do I get my Discord token?

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to "Bot" section
4. Click "Add Bot"
5. Under TOKEN, click "Copy"

**Important:** Keep this token secret! Never share or commit it.

### How do I invite the bot to my server?

1. Go to Discord Developer Portal
2. Select your application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes: `bot` and `applications.commands`
5. Select permissions needed
6. Copy generated URL
7. Open URL in browser and select server

### Can I run multiple bot instances?

Yes! They'll share the same Redis and SQLite database. Make sure:

- Same DISCORD_TOKEN
- Same CLIENT_ID
- Different instances can run in parallel
- Use a load balancer if needed

---

## Usage & Commands

### How do I use slash commands?

Type `/` in Discord and select the command:

1. Type `/`
2. Search for command (e.g., `ping`)
3. Fill in parameters
4. Press Enter

### How do I use prefix commands?

Type `!` followed by command name:

```
!ping
!allow-command admin
!deploy production
```

### How do I see all available commands?

In Discord:

- Type `/help` for slash command list
- Type `!help` for prefix command list

In terminal (if running bot):

- Check logs during startup
- Lists all registered commands

### Can I customize commands?

Yes! See [Adding Commands](./14-ADDING-COMMANDS.md) for details on creating custom commands.

### How do I add a new command?

1. Create handler in `src/app/handlers/`
2. Implement business logic
3. Write tests
4. Restart bot

See detailed guide at [Adding Commands](./14-ADDING-COMMANDS.md).

---

## Permissions

### What is the permission system?

VeraBot uses role-based, channel-based, and user-based permissions. Admins can:

- Allow commands for specific roles
- Allow commands in specific channels
- Allow commands for specific users
- Deny commands globally

### How do I grant someone permission?

```
/allow-command deploy @user
/allow-role admin @role
/allow-channel ping #general
```

Or with prefix commands:

```
!allow-command deploy @user
```

### What's the permission hierarchy?

```
Admin (Can change permissions)
  ├─ Allowed Users (Specific users with access)
  ├─ Allowed Roles (Roles with access)
  └─ Allowed Channels (Channels where allowed)
```

### How do I check who has permission?

```
/audit
/allowed-commands
```

Shows all permission grants and denials.

---

## Troubleshooting

### Bot not responding

**Check:**

1. Is bot online? (Green dot in Discord)
2. Run `/ping` to test

**Solution:**

1. Restart bot: `npm start`
2. Check logs: `LOG_LEVEL=debug npm start`
3. Verify bot has channel permissions

### Command not appearing

**Check:**

1. Is bot updated?
2. Do you have permission?
3. Try different channel

**Solution:**

1. Restart bot
2. Refresh Discord (`Ctrl+R`)
3. Wait 5-10 seconds for registration
4. Ask admin for permission

### Redis connection error

**Error:** "Cannot connect to Redis"

**Check:**

1. Is Redis running?
2. Correct host/port?
3. Network connectivity?

**Solution:**

```bash
redis-server              # Start Redis
# or
docker run -d -p 6379:6379 redis  # Docker
```

### Database locked

**Error:** "Database locked"

**Cause:** SQLite concurrent access

**Solution:** Only one bot instance at a time, or use different databases

### Tests failing

**Solution:**

```bash
npm install                 # Reinstall dependencies
npm test                    # Run again
npm test -- --no-cache     # Clear cache
```

See [Testing Guide](./15-TESTING.md) for help.

---

## Development

### How do I contribute?

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Write tests
5. Run tests: `npm test`
6. Commit: `git commit -m "feat: description"`
7. Push: `git push origin feature/my-feature`
8. Create pull request

### How do I report a bug?

1. Open GitHub issue with:
   - Description of bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error messages/logs
   - Your environment (Node version, OS, etc.)

### How do I request a feature?

1. Open GitHub discussion or issue
2. Describe what you want
3. Why you need it
4. How it should work

### What testing is required?

- Unit tests for new functions
- Integration tests for features
- Minimum 70% code coverage
- All tests passing

See [Testing Guide](./15-TESTING.md).

### How do I run tests?

```bash
npm test                    # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:unit          # Only unit tests
npm run test:integration   # Only integration tests
```

---

## Performance

### How much RAM does VeraBot need?

- Minimum: 512MB
- Recommended: 2GB
- Depends on: Job queue size, number of commands, usage patterns

### How many commands can it handle?

- Currently supports 45+ commands
- Easily extensible
- Limited only by Discord API rate limits

### Can it handle high load?

Yes! Features for scaling:

- Job queue offloads work
- Redis caching
- SQLite with indexes
- Middleware pipeline can filter/batch
- Multiple instances supported

### How do I monitor performance?

1. Health endpoint: `curl http://localhost:3000/health`
2. Metrics endpoint: `curl http://localhost:3000/metrics`
3. Job queue UI: `http://localhost:3002/admin/queues`
4. Logs: Set `LOG_LEVEL=debug`

---

## Security

### Is my Discord token safe?

Only if you:

- Never commit it to git
- Use `.env` file with `DISCORD_TOKEN`
- Keep `.env` in `.gitignore`
- Don't share your `.env` file
- Regenerate token if compromised

### Are commands permission-checked?

Yes! Every command goes through:

1. Permission middleware - Checks access
2. Rate limit middleware - Prevents abuse
3. Audit middleware - Logs all actions

### Can I restrict commands to certain channels?

Yes! Per-command channel restrictions:

```
/allow-channel deploy #ops-channel
```

### Is the database encrypted?

SQLite doesn't support encryption natively. For production:

- Use disk-level encryption
- Run on secure servers
- Restrict database file access
- Consider replacing SQLite with PostgreSQL

---

## Deployment

### How do I deploy to production?

See [Deployment Guide](./18-DEPLOYMENT.md).

Quick version:

1. Set `NODE_ENV=production`
2. Set `LOG_LEVEL=warn`
3. Use external Redis and database if possible
4. Monitor with health checks
5. Set up logging/error tracking

### Can I use Docker?

Yes! Dockerfile included:

```bash
docker build -t verabot .
docker run -e DISCORD_TOKEN=xxx -e CLIENT_ID=xxx verabot
```

### How do I monitor in production?

1. Health check: `/health` endpoint
2. Metrics: `/metrics` endpoint (Prometheus format)
3. Logs: Centralize with ELK/Splunk
4. Job queue: Bull Board UI
5. Alerts: Set up for failures

### How do I scale to multiple instances?

1. Run multiple bot instances
2. Share same Redis
3. Share same SQLite (or use PostgreSQL)
4. Use load balancer for HTTP endpoints
5. Monitor with centralized logging

---

## Costs

### Is VeraBot free?

Yes! VeraBot itself is free and open source.

Potential costs:

- **Discord:** Free (for bot)
- **Server hosting:** Varies ($5-50+/month)
- **Redis hosting:** Free-$20+/month
- **Database:** Free (SQLite) or varies (PostgreSQL)

---

## Getting Help

### Documentation

- [Getting Started](./1-GETTING-STARTED.md)
- [User Manual](./4-USER-MANUAL.md)
- [Command Reference](./5-COMMAND-REFERENCE.md)
- [Troubleshooting](./20-TROUBLESHOOTING.md)

### Community

- GitHub Issues - Bug reports
- GitHub Discussions - Questions
- Discord community (if available)

### Professional Support

For commercial support, consulting, or custom features:

- Contact repository maintainers
- Check repository for contact info

---

## Version Info

- **Current Version:** 1.0.0
- **Node.js Support:** 18+
- **Discord.js Version:** 14.16+
- **Last Updated:** December 2025

---

## More Questions?

Check:

1. [Glossary](./21-GLOSSARY.md) - Key terms
2. [Resources](./23-RESOURCES.md) - External links
3. [Troubleshooting](./20-TROUBLESHOOTING.md) - Common issues
4. Open GitHub issue with your question

---

**Previous:** [Glossary](./21-GLOSSARY.md) | **Next:** [Resources](./23-RESOURCES.md)
