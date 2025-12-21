# 20. Troubleshooting

Solutions for common VeraBot issues and errors.

---

## Bot Connectivity

### Bot Not Responding

**Symptoms:** Commands don't work, bot appears offline

**Diagnosis:**
1. Check bot status in Discord (green/red dot)
2. Check logs: `LOG_LEVEL=debug npm start`
3. Try `/ping` command
4. Check Redis connection

**Solutions:**
```bash
# Restart bot
npm start

# Check logs
LOG_LEVEL=debug npm start

# Verify Redis
redis-server

# Check network
ping discord.com
```

### Bot Offline in Discord

**Cause:** Bot process crashed or disconnected

**Solution:**
```bash
# Restart bot
npm start

# Check error logs
tail -f logs/*

# Check for port conflicts
lsof -i :3000
```

---

## Permission Issues

### "Insufficient Permissions" Error

**Cause:** User doesn't have permission for command

**Solution:**
```
# Admin runs:
/allow-command deploy @user
/allow-role command @role
/allow-channel command #channel
```

### Admin Command Not Working

**Cause:** Admin permissions not setup

**Solution:**
1. Verify you're Discord server admin
2. Try `/info` to check your role
3. Ask server owner for admin role

---

## Database Issues

### "Database Locked" Error

**Cause:** Multiple bot instances or processes accessing SQLite simultaneously

**Solution:**
```bash
# Only run one instance
npm start

# If multiple instances needed, use different databases
DATABASE_PATH=./db-2.db npm start
```

### Database File Corruption

**Cause:** Unexpected crash while writing

**Solution:**
```bash
# Backup old database
mv database.db database.db.backup

# Delete corrupted database
rm database.db

# Restart bot (recreates schema)
npm start
```

---

## Command Issues

### Command Not Appearing

**Symptoms:** Slash command not in Discord autocomplete

**Diagnosis:**
1. Type `/` and search for command
2. Check logs for registration errors
3. Verify bot has permissions

**Solutions:**
```bash
# Restart bot to re-register
npm start

# Refresh Discord
Ctrl+R (Windows)
Cmd+R (Mac)

# Force re-register
rm database.db
npm start
```

### Command Times Out

**Cause:** Command taking too long to execute

**Solution:**
1. Check system resources
2. Look for slow database queries
3. Check logs: `LOG_LEVEL=debug npm start`

---

## Redis Issues

### Cannot Connect to Redis

**Error:** `ECONNREFUSED 127.0.0.1:6379`

**Check:**
1. Is Redis running?
2. Correct host/port?
3. Firewall blocking?

**Solutions:**
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis

# Verify connection
redis-cli ping
# Should respond: PONG

# Check connection settings
cat .env | grep REDIS
```

### Redis Authentication Failed

**Error:** `NOAUTH Authentication required`

**Solution:**
```env
REDIS_PASSWORD=your_password
```

Make sure password matches Redis config.

---

## Installation Issues

### `npm install` Fails

**Cause:** Network, permissions, or Node version issues

**Solution:**
```bash
# Check Node version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Try install again
npm install

# Or use yarn
yarn install
```

### Module Not Found

**Error:** `Cannot find module 'discord.js'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Verify installation
npm ls
```

---

## Test Failures

### Tests Not Running

**Error:** No tests found or jest not running

**Solution:**
```bash
# Install dependencies
npm install

# Run tests
npm test

# Clear cache
npm test -- --no-cache
```

### Test Timeout

**Error:** Test takes longer than 5 seconds

**Solution:**
1. Optimize slow operations
2. Increase timeout for specific test
3. Check for infinite loops

### Coverage Not Generated

**Solution:**
```bash
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Configuration Issues

### `DISCORD_TOKEN` Not Found

**Error:** Application won't start without token

**Solution:**
1. Create `.env` file:
   ```bash
   cat > .env << EOF
   DISCORD_TOKEN=your_token
   CLIENT_ID=your_id
   REDIS_HOST=localhost
   REDIS_PORT=6379
   EOF
   ```

2. Get token from Discord Developer Portal
3. Restart bot

### Environment Variables Not Loading

**Solution:**
1. Verify `.env` file exists in project root
2. Check file permissions: `chmod 600 .env`
3. Restart bot after changing `.env`
4. Use `dotenv` to verify:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.DISCORD_TOKEN)"
   ```

---

## Performance Issues

### High Memory Usage

**Check:**
```bash
ps aux | grep node    # See memory usage
```

**Solutions:**
1. Increase available RAM
2. Check for memory leaks
3. Monitor job queue size
4. Limit cache sizes

### Slow Command Response

**Diagnosis:**
```bash
LOG_LEVEL=debug npm start
# Look for command execution times
```

**Solutions:**
1. Add database indexes
2. Cache frequently-used data
3. Offload to job queue
4. Check for slow queries

---

## Error Messages

### "Invalid Token"

**Cause:** Wrong or expired Discord token

**Solution:**
1. Get new token from Discord Developer Portal
2. Update `.env`
3. Restart bot

### "Invalid Application ID"

**Cause:** Wrong or missing CLIENT_ID

**Solution:**
1. Get correct ID from Discord Developer Portal
2. Update `.env`
3. Restart bot

### "Rate Limited"

**Cause:** Too many API requests

**Solution:**
1. Reduce request frequency
2. Implement backoff/retry logic
3. Increase rate limit windows

---

## Getting Help

### Debug Steps

When reporting issues, provide:
1. Error message (full text)
2. Steps to reproduce
3. Log output: `LOG_LEVEL=debug npm start`
4. System info: `node --version`, `npm --version`
5. Environment: OS, RAM, Node version

### Useful Commands

```bash
# Check status
npm test

# Get logs
LOG_LEVEL=debug npm start 2>&1 | head -50

# Check dependencies
npm ls

# Verify Node
node --version

# Test Redis
redis-cli ping
```

### Support Resources

- [FAQ](./22-FAQ.md) - Common questions
- [Glossary](./21-GLOSSARY.md) - Terms explained
- [GitHub Issues](https://github.com/Rarsus/verabot/issues)

---

**Next:** [FAQ](./22-FAQ.md)
