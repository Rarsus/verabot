# 5. Command Reference

Complete catalog of all VeraBot commands with descriptions and usage examples.

---

## Quick Navigation

- [Core Commands](#core-commands) - Essential bot features
- [Admin Commands](#admin-commands) - Permission & administration
- [Messaging Commands](#messaging-commands) - Communication tools
- [Operations Commands](#operations-commands) - Deployment & jobs

---

## Core Commands

### `/ping`
**Description:** Test bot responsiveness

**Usage:**
```
/ping
```

**Response:**
```
Pong! Response time: 125ms
```

**Permissions:** Public

---

### `/info`
**Description:** Display bot information and version

**Usage:**
```
/info
```

**Response:**
```
Bot Name: VeraBot
Version: 1.0.0
Uptime: 2 hours 15 minutes
Commands: 45
```

**Permissions:** Public

---

### `/help`
**Description:** List available commands or get help for specific command

**Usage:**
```
/help
/help deploy
/help admin
```

**Response:**
```
Available Commands:
- Core: ping, info, help, stats, uptime
- Admin: allow-command, allow-user, deny-command
- ...
```

**Permissions:** Public

---

### `/stats`
**Description:** Show command usage statistics

**Usage:**
```
/stats
```

**Response:**
```
Total Commands Executed: 1,245
Most Used: ping (234)
Errors: 12
Rate Limited: 5
```

**Permissions:** Public

---

### `/uptime`
**Description:** Show bot uptime and status

**Usage:**
```
/uptime
```

**Response:**
```
Bot Uptime: 5 days 3 hours 24 minutes
Status: Healthy
Memory: 125MB / 512MB
```

**Permissions:** Public

---

## Admin Commands

### `/allow-command`
**Description:** Allow a command for user, role, or channel

**Usage:**
```
/allow-command deploy                  # Allow for everyone
/allow-command deploy @user            # Allow for specific user
/allow-command deploy @role            # Allow for role
/allow-command deploy #channel         # Allow in channel
```

**Permissions:** Admin only

---

### `/allow-user`
**Description:** Grant user access to command

**Usage:**
```
/allow-user deploy @john
```

**Permissions:** Admin only

---

### `/allow-role`
**Description:** Grant role access to command

**Usage:**
```
/allow-role admin @developers
```

**Permissions:** Admin only

---

### `/allow-channel`
**Description:** Allow command in specific channel

**Usage:**
```
/allow-channel ping #general
```

**Permissions:** Admin only

---

### `/deny-command`
**Description:** Block a command globally

**Usage:**
```
/deny-command dangerous-command
```

**Permissions:** Admin only

---

### `/audit`
**Description:** View audit log of permission changes

**Usage:**
```
/audit                          # Last 50 entries
/audit --type permissions       # Only permission changes
/audit --user @john            # Only john's actions
/audit --limit 100             # Last 100 entries
```

**Response:**
```
Permission Changes:
[2025-12-21 10:30] Admin allowed ping for @user1
[2025-12-21 10:25] Admin denied deploy
[2025-12-21 10:20] Admin allowed admin role for @team
```

**Permissions:** Admin only

---

### `/allowed-commands`
**Description:** List all currently allowed commands

**Usage:**
```
/allowed-commands
/allowed-commands @user
/allowed-commands #channel
```

**Response:**
```
Allowed Commands:
- ping (public)
- info (public)
- deploy (admin role)
- say (team members)
```

**Permissions:** Admin only

---

## Messaging Commands

### `/say`
**Description:** Send a message as the bot

**Usage:**
```
/say Hello everyone!
```

**Response:**
```
[Message sent to #general]
Hello everyone!
```

**Permissions:** Role-restricted

---

### `/broadcast`
**Description:** Send message to multiple channels

**Usage:**
```
/broadcast "Important announcement" #general #announcements
```

**Permissions:** Admin only

---

### `/notify`
**Description:** Send notification to specific user

**Usage:**
```
/notify @user "Your task is complete"
```

**Permissions:** Role-restricted

---

## Operations Commands

### `/deploy`
**Description:** Deploy to environment

**Usage:**
```
/deploy production
/deploy production staging    # Deploy to multiple
```

**Response:**
```
Deployment started to production
Job ID: deploy-12345
Status: Running
```

**Permissions:** Admin only

---

### `/job-status`
**Description:** Check status of a job

**Usage:**
```
/job-status deploy-12345
```

**Response:**
```
Job ID: deploy-12345
Status: Running
Progress: 50%
Started: 2025-12-21 10:30
```

**Permissions:** Admin only

---

### `/heavy-work`
**Description:** Execute heavy background task

**Usage:**
```
/heavy-work
```

**Response:**
```
Heavy work job queued
Job ID: heavywork-789
Check status: /job-status heavywork-789
```

**Permissions:** Admin only

---

## Prefix Commands (Legacy)

All slash commands also available with `!` prefix:

```
!ping
!info
!help
!allow-command deploy @user
!audit
!deploy production
!job-status job-123
```

---

## Command Syntax Guide

### Required Parameters

```
/command <param>    # Must be provided
/allow-command ping # "ping" is required
```

### Optional Parameters

```
/command [param]          # Can be omitted
/audit --limit 100       # Optional limit
```

### Multiple Values

```
/deploy prod staging     # Multiple environments
/broadcast "msg" #ch1 #ch2  # Multiple channels
```

### Quoted Strings

```
/say "Message with spaces"
/broadcast "Important update" #channel
```

---

## Permission Levels

| Command | Required |
|---------|----------|
| `/ping`, `/info`, `/help`, `/stats`, `/uptime` | Public |
| `/say`, `/notify` | Role-restricted |
| `/allow-*`, `/deny-*`, `/audit`, `/deploy` | Admin only |

---

## Tips & Tricks

### Quick Commands

Use up arrow to repeat last command:
```
/ping         ← Enter
↑ Repeat with up arrow
```

### Slash Command Autocomplete

Start typing in `/` dropdown to filter.

### Batch Operations

```
!allow-command ping @user1
!allow-command ping @user2
!allow-command ping @user3
```

Or use roles:
```
/allow-role ping members
```

### View Job Progress

```
/job-status <job-id>        # Check once
# Or open Bull Board UI
http://localhost:3002/admin/queues
```

---

## Command Categories

### By Frequency
1. `/ping` - Most used, basic test
2. `/help` - Finding commands
3. `/say` - Sending messages
4. `/info` - Bot information

### By Permission Level
1. **Public** - ping, info, help, stats, uptime
2. **Role-restricted** - say, notify
3. **Admin only** - deploy, audit, allow-*, deny-*

### By Function
1. **Utility** - ping, info, help, stats, uptime
2. **Admin** - allow-*, deny-*, audit, allowed-commands
3. **Communication** - say, broadcast, notify
4. **Operations** - deploy, job-status, heavy-work

---

## Error Responses

```
"Unknown command"           # Command doesn't exist
"Insufficient permissions"  # You lack access
"Invalid arguments"         # Wrong format
"Command timed out"        # Too long
"Invalid parameter"        # Bad value
```

See [Troubleshooting](./20-TROUBLESHOOTING.md) for solutions.

---

## Next Steps

- [User Manual](./4-USER-MANUAL.md) - How to use the bot
- [Permissions](./6-PERMISSIONS.md) - Permission system
- [Adding Commands](./14-ADDING-COMMANDS.md) - Create new commands

---

**Previous:** [User Manual](./4-USER-MANUAL.md) | **Next:** [Permissions](./6-PERMISSIONS.md)
