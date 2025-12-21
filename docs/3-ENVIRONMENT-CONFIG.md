# 3. Environment Configuration

Detailed explanation of all environment variables and configuration options.

---

## Environment Variables

### Discord Configuration

#### DISCORD_TOKEN (Required)
Bot authentication token from Discord

```env
DISCORD_TOKEN=MTA...
```

**How to get:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "Bot" section
4. Under TOKEN, click "Copy"

**Security:** Keep this secret! Never commit to git.

#### CLIENT_ID (Required)
Discord application ID

```env
CLIENT_ID=1234567890
```

**How to get:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "General Information"
4. Copy "APPLICATION ID"

### Redis Configuration

#### REDIS_HOST (Default: localhost)
Redis server hostname or IP address

```env
REDIS_HOST=localhost
REDIS_HOST=redis.example.com
REDIS_HOST=127.0.0.1
```

#### REDIS_PORT (Default: 6379)
Redis server port

```env
REDIS_PORT=6379
REDIS_PORT=6380
```

#### REDIS_PASSWORD (Optional)
Redis authentication password

```env
REDIS_PASSWORD=my-secure-password
```

Leave blank if no password required.

### Application Configuration

#### NODE_ENV (Default: development)
Execution environment

```env
NODE_ENV=development    # Development mode
NODE_ENV=production     # Production mode
NODE_ENV=test          # Testing mode
```

Effects:
- **development:** Detailed logging, auto-reload, no optimizations
- **production:** Minimal logging, full optimizations, error tracking
- **test:** Special test configuration

#### LOG_LEVEL (Default: info)
Logging verbosity level

```env
LOG_LEVEL=debug      # All messages
LOG_LEVEL=info       # Info and above
LOG_LEVEL=warn       # Warnings and errors only
LOG_LEVEL=error      # Errors only
```

Usage:
```
debug > info > warn > error
```

#### GUILD_ID (Optional)
Discord guild ID for faster command registration

```env
GUILD_ID=1234567890
```

Speeds up slash command registration in development. Without this, registration takes ~1 hour.

**How to get:**
1. Enable Developer Mode in Discord
2. Right-click server name
3. Select "Copy Server ID"

### Complete .env Example

```env
# Required
DISCORD_TOKEN=MTA...
CLIENT_ID=1234567890

# Redis (required for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application settings
NODE_ENV=development
LOG_LEVEL=info
GUILD_ID=1234567890
```

---

## Configuration Validation

When starting the bot, it validates:

1. **DISCORD_TOKEN** - Must be present and valid format
2. **CLIENT_ID** - Must be present and numeric
3. **REDIS_HOST** - Must be reachable
4. **REDIS_PORT** - Must be numeric

If validation fails, the bot will exit with an error message.

---

## Environment-Specific Settings

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
GUILD_ID=your_test_guild_id
```

Use for:
- Local development
- Testing features
- Debugging issues
- Rapid iteration

### Production

```env
NODE_ENV=production
LOG_LEVEL=warn
```

Use for:
- Live servers
- Public bots
- Production workloads
- Stable releases

### Testing

```env
NODE_ENV=test
LOG_LEVEL=error
```

Automatically set when running `npm test`.

---

## Configuration File

Alternative to `.env`, can use `.env.json`:

```json
{
  "DISCORD_TOKEN": "MTA...",
  "CLIENT_ID": "1234567890",
  "REDIS_HOST": "localhost",
  "REDIS_PORT": 6379,
  "NODE_ENV": "development",
  "LOG_LEVEL": "info"
}
```

---

## Common Configuration Issues

### Missing DISCORD_TOKEN

**Error:** `DISCORD_TOKEN not found in environment`

**Solution:**
1. Create `.env` file in project root
2. Add: `DISCORD_TOKEN=your_token_here`
3. Restart bot

### Redis Connection Failed

**Error:** `Cannot connect to Redis at localhost:6379`

**Solution:**
1. Ensure Redis is running: `redis-server`
2. Check REDIS_HOST and REDIS_PORT
3. Verify network connectivity
4. Check firewall rules

### Log Level Not Taking Effect

**Error:** Still seeing debug logs on info level

**Solution:**
1. Save `.env` file
2. Restart bot completely
3. Verify LOG_LEVEL in `.env`

---

## Next Steps

- [Getting Started](./1-GETTING-STARTED.md) - Setup instructions
- [Quick Start](./2-QUICK-START.md) - 5-minute guide
- [User Manual](./4-USER-MANUAL.md) - Using the bot

---

**Previous:** [Quick Start](./2-QUICK-START.md) | **Next:** [User Manual](./4-USER-MANUAL.md)
