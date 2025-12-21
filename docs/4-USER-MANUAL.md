# 4. User Manual

Complete guide to using VeraBot - how to interact with the bot and use its features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Command Basics](#command-basics)
3. [Command Types](#command-types)
4. [Using Slash Commands](#using-slash-commands)
5. [Using Prefix Commands](#using-prefix-commands)
6. [Command Categories](#command-categories)
7. [Permissions & Access](#permissions--access)
8. [Tips & Tricks](#tips--tricks)
9. [Getting Help](#getting-help)

---

## Getting Started

### What is VeraBot?

VeraBot is a Discord bot that provides:
- **Administrative Tools** - Permission management, channel control
- **Utilities** - Information, status, help
- **Communication** - Broadcast messages, notifications
- **Operations** - Deployment, job management, system control

### Requirements

- VeraBot must be invited to your server
- You must have appropriate permissions
- Most commands are role-restricted

---

## Command Basics

### How to Use Commands

Commands can be accessed in two ways:

1. **Slash Commands** (Recommended)
   - Type `/` in Discord
   - Select VeraBot command
   - Fill in parameters
   - Press Enter

2. **Prefix Commands**
   - Type `!` followed by command name
   - Example: `!ping`

### Command Structure

```
/command-name <required-param> [optional-param]

Examples:
/ping                          # No parameters
/allow-command ping            # One parameter
/deploy production staging     # Multiple parameters
```

---

## Using Slash Commands

### Accessing Slash Commands

**Step 1:** Type `/` in Discord message box

You'll see a list of available commands.

**Step 2:** Search for the command

Type command name to filter list:
```
/info          → Shows bot information
/allow         → Allows a command for someone
/help          → Shows available commands
```

**Step 3:** Fill in parameters

As you select a command, parameter fields appear:
- **Required parameters** - Must be filled
- **Optional parameters** - Can be left blank

**Step 4:** Execute

Press Enter or click "Send" to execute.

### Example: Allow Command

```
/allow-command
  Command: ping           (required)
  User:    @John          (optional)
  Role:    admin          (optional)
  Channel: #general       (optional)
```

Press Enter to execute.

---

## Using Prefix Commands

### Prefix Command Syntax

Prefix is `!` by default.

**Format:**
```
!command arg1 arg2 arg3
```

**Examples:**
```
!ping                       # No arguments
!allow-command ping         # One argument
!deploy production staging  # Multiple arguments
!audit permission           # Specific audit type
```

### Advantages
- Faster for experienced users
- Can be scripted
- Works in message editing

### Disadvantages
- Less user-friendly
- Requires knowing command names
- No parameter hints

---

## Command Categories

### Core Commands
Essential bot functionality

- `/info` - Bot information and version
- `/ping` - Test bot responsiveness
- `/help` - List all commands
- `/stats` - Command usage statistics
- `/uptime` - Bot uptime information

### Admin Commands
Permission management (requires admin role)

- `/allow-command` - Allow a command
- `/allow-user` - Allow specific user
- `/allow-role` - Allow specific role
- `/allow-channel` - Allow specific channel
- `/deny-command` - Deny a command
- `/audit` - View audit log
- `/allowed-commands` - List allowed commands

### Messaging Commands
Communication tools

- `/say` - Send message
- `/broadcast` - Send to multiple channels
- `/notify` - Send notification
- `/reply` - Reply to thread

### Operations Commands
Operational tasks

- `/deploy` - Deploy to environment
- `/job-status` - Check job status
- `/heavy-work` - Execute heavy task
- `/logs` - View system logs

---

## Permissions & Access

### Permission Levels

Commands have permission requirements:

| Level | Who | How to Get |
|-------|-----|-----------|
| Public | Everyone | Default |
| Role-Based | Specific role | Admin grants |
| User-Based | Specific user | Admin allows |
| Channel-Based | Specific channel | Admin allows |
| Admin | Server admins | Discord role |

### Checking Your Permissions

Run `/info` to see:
- Your current role
- Commands you have access to
- Your permission level

### Requesting Access

If you don't have permission:

```
Error: You lack permissions for this command
```

**Solution:**
1. Ask server admin
2. Admin runs: `/allow-command <command> @you`
3. Try again

### Viewing Audit Trail

Admin only:
```
/audit
```

Shows:
- Permission changes
- Who made changes
- When changes were made
- Commands executed

---

## Tips & Tricks

### Quick Commands

**Favorite frequently-used commands:**

1. Type `/` and find command
2. Look for star icon
3. Click to favorite
4. Shows at top of list

### Command History

Press ⬆️ arrow to repeat last command.

### Parameters with Spaces

Use quotes for parameters with spaces:

```
/say "This is my message"    # Message with spaces
/notify "Important update"   # Another example
```

### Batch Operations

For multiple operations:

```
!allow-command ping @user1
!allow-command ping @user2
!allow-command ping @user3
```

Or use role-based:

```
/allow-role ping members
```

### View Help for Command

```
/help <command-name>

Examples:
/help deploy
/help audit
/help say
```

---

## Getting Help

### Built-in Help

```
/help                        # All commands
/help deploy                 # Specific command
/help admin                  # Command category
```

### Support Channels

1. **#bot-help** - Ask questions
2. **#bugs** - Report issues
3. **#suggestions** - Suggest features
4. **DM Bot** - Direct message for private help

### Common Issues

#### "Unknown Command"
- Check command name spelling
- Use `/help` to find correct name
- Command might be restricted

#### "Insufficient Permissions"
- Ask admin for permission
- Check if command requires role
- See [Permissions & Access](#permissions--access)

#### "Command Timed Out"
- Command is taking too long
- Try again in a moment
- Check bot status with `/ping`

#### "Invalid Parameter"
- Check parameter format
- Required parameters must be filled
- See specific command help

---

## Troubleshooting

### Bot Not Responding

**Check:**
1. Is bot online? (Green dot on bot profile)
2. Does bot have permission in channel?
3. Is channel bot-disabled?

**Solution:**
1. Ask admin to check bot permissions
2. Try in #general or test channel
3. Ping bot: `/ping`

### Command Not Appearing

**Check:**
1. Is bot updated? (Ask admin)
2. Do you have permission? (`/info`)
3. Is command restricted to certain channel?

**Solution:**
1. Wait for bot restart
2. Request admin permission
3. Try in different channel

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Unknown command" | Command doesn't exist | Check spelling |
| "Insufficient permissions" | You can't use this | Request admin access |
| "Invalid arguments" | Wrong format | Check `/help <command>` |
| "Command timed out" | Bot took too long | Try again |
| "Blocked command" | Command disabled | Ask admin |

---

## Advanced Usage

### Webhook Proxy

For external services to trigger bot commands:

1. Get webhook URL from admin
2. POST to webhook with command
3. Bot executes command
4. Get result in response

**Format:**
```json
{
  "command": "ping",
  "args": []
}
```

### Job Queue Status

Check long-running operations:

```
/job-status <job-id>
```

Shows:
- Current status (pending/running/completed/failed)
- Progress
- Result or error

### Audit Log

Review all permission changes:

```
/audit --type permissions
/audit --type commands
/audit --limit 50
```

---

## Quick Reference

### Most Used Commands

```
/ping              Test bot
/help              List commands
/info              Bot information
/allow-command     Grant permission
/say               Send message
/audit             View audit log
/deploy            Deploy system
/job-status        Check job
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Start command |
| `@` | Mention user/role |
| `↑` | Previous command |
| `Tab` | Autocomplete |
| `Enter` | Execute |

---

## What's Next?

- [Command Reference](./5-COMMAND-REFERENCE.md) - All command details
- [Permissions](./6-PERMISSIONS.md) - Permission system explained
- [Troubleshooting](./20-TROUBLESHOOTING.md) - Common issues & solutions

---

**Previous:** [Environment Config](./3-ENVIRONMENT-CONFIG.md) | **Next:** [Command Reference](./5-COMMAND-REFERENCE.md)
