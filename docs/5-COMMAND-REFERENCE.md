# 5. Command Reference

Complete catalog of all VeraBot commands with descriptions and usage examples.

---

## Quick Navigation

- [Core Commands](#core-commands) - Essential bot features
- [Admin Commands](#admin-commands) - Permission & administration
- [Messaging Commands](#messaging-commands) - Communication tools
- [Operations Commands](#operations-commands) - Deployment & jobs
- [Quote Commands](#quote-commands) - Quote management
- [Dare Commands](#dare-commands) - AI-powered dare system

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

| Command                                        | Required        |
| ---------------------------------------------- | --------------- |
| `/ping`, `/info`, `/help`, `/stats`, `/uptime` | Public          |
| `/quote addquote`, `/quote quote`, `/quote randomquote`, `/quote listquotes`, `/quote searchquotes` | Public |
| `/dare create`, `/dare list`, `/dare get`, `/dare give`, `/dare complete` | Public |
| `/say`, `/notify`                              | Role-restricted |
| `/dare update`, `/dare delete`                 | ManageMessages  |
| `/allow-*`, `/deny-*`, `/audit`, `/deploy`     | Admin only      |

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

1. **Public** - ping, info, help, stats, uptime, quotes, dare create, dare list, dare get, dare give, dare complete
2. **Role-restricted** - say, notify
3. **ManageMessages** - dare update, dare delete
4. **Admin only** - deploy, audit, allow-*, deny-*

### By Function

1. **Utility** - ping, info, help, stats, uptime
2. **Admin** - allow-*, deny-*, audit, allowed-commands
3. **Communication** - say, broadcast, notify
4. **Operations** - deploy, job-status, heavy-work
5. **Content** - quotes (add, list, search, random), dares (AI-powered dare system)

---

## Quote Commands

Manage and retrieve quotes stored in the database.

### `/quote addquote`

**Description:** Add a new quote to the database

**Usage:**

```
/quote addquote text:<quote> [author:<name>]
```

**Parameters:**

- `text` (required) - The quote text to add
- `author` (optional) - The author of the quote (defaults to "Anonymous")

**Examples:**

```
/quote addquote text:"To be or not to be" author:"Shakespeare"
/quote addquote text:"Hello World"
```

**Permissions:** Public (default cooldown: 5 seconds)

---

### `/quote quote`

**Description:** Get a specific quote by its ID

**Usage:**

```
/quote quote id:<number>
```

**Parameters:**

- `id` (required) - The ID of the quote to retrieve

**Examples:**

```
/quote quote id:1
/quote quote id:42
```

**Response:**

```
> To be or not to be
— Shakespeare
```

**Permissions:** Public (default cooldown: 2 seconds)

---

### `/quote randomquote`

**Description:** Get a random quote from the database

**Usage:**

```
/quote randomquote
```

**Examples:**

```
/quote randomquote
```

**Response:**

```
> To be or not to be
— Shakespeare
```

**Permissions:** Public (default cooldown: 3 seconds)

---

### `/quote listquotes`

**Description:** List all quotes in the database

**Usage:**

```
/quote listquotes
```

**Examples:**

```
/quote listquotes
```

**Response:**

Returns a list of all quotes with their IDs, text, and authors.

**Permissions:** Public (default cooldown: 5 seconds)

---

### `/quote searchquotes`

**Description:** Search quotes by text or author

**Usage:**

```
/quote searchquotes query:<search>
```

**Parameters:**

- `query` (required) - The search term to find in quote text or author names

**Examples:**

```
/quote searchquotes query:"wisdom"
/quote searchquotes query:"Einstein"
```

**Response:**

Returns all quotes matching the search query.

**Permissions:** Public (default cooldown: 3 seconds)

---

## Dare Commands

AI-powered dare generation and management system with full CRUD operations.

### `/dare create`

**Description:** Generate a new AI-powered dare using Perchance.org API

**Usage:**

```
/dare create [theme:<theme>]
```

**Parameters:**

- `theme` (optional) - Dare theme/category
  - Options: general, funny, creative, social, physical, mental
  - Default: general

**Examples:**

```
/dare create
/dare create theme:funny
/dare create theme:creative
```

**Response:**

```
Dare #1 created successfully!
> Do 10 jumping jacks right now
Theme: general | Source: perchance
```

**Permissions:** Public (default cooldown: 5 seconds)

---

### `/dare list`

**Description:** List all dares with optional pagination and filtering

**Usage:**

```
/dare list [page:<number>] [status:<status>] [theme:<theme>]
```

**Parameters:**

- `page` (optional) - Page number for pagination (20 items per page)
- `status` (optional) - Filter by dare status
  - Options: active, completed, archived
- `theme` (optional) - Filter by theme

**Examples:**

```
/dare list
/dare list page:2
/dare list status:active theme:funny
```

**Response:**

```
Found 15 dares (Page 1 of 1)

#1: Do 10 jumping jacks right now [active]
#2: Post your favorite meme in the chat [active]
#3: Share an embarrassing but funny story [completed]
...
```

**Permissions:** Public (default cooldown: 3 seconds)

---

### `/dare get`

**Description:** Get a specific dare by its ID

**Usage:**

```
/dare get dare_id:<id>
```

**Parameters:**

- `dare_id` (required) - The ID of the dare to retrieve

**Examples:**

```
/dare get dare_id:1
/dare get dare_id:42
```

**Response:**

```
Dare #1
> Do 10 jumping jacks right now
Status: active | Theme: general | Source: perchance
Created by: @User123 on 2025-12-25
```

**Permissions:** Public (default cooldown: 2 seconds)

---

### `/dare give`

**Description:** Give a dare to a specific Discord user

**Usage:**

```
/dare give user:<user> [random:<true/false>] [theme:<theme>]
```

**Parameters:**

- `user` (required) - Discord user to give the dare to
- `random` (optional) - Use random existing dare (true) or generate fresh (false)
  - Default: false (generate new)
- `theme` (optional) - Dare theme for generation/filtering

**Examples:**

```
/dare give user:@User
/dare give user:@User random:true
/dare give user:@User theme:funny
```

**Response:**

```
Dare #1 assigned to <@User>!
> Post your favorite meme in the chat
Theme: funny
```

**Permissions:** Public (default cooldown: 5 seconds)

---

### `/dare update`

**Description:** Update an existing dare's content, status, or theme

**Usage:**

```
/dare update dare_id:<id> [content:<text>] [status:<status>] [theme:<theme>]
```

**Parameters:**

- `dare_id` (required) - The ID of the dare to update
- `content` (optional) - New dare content text (max 500 characters)
- `status` (optional) - New status
  - Options: active, completed, archived
- `theme` (optional) - New theme

**Examples:**

```
/dare update dare_id:1 content:"New dare text"
/dare update dare_id:1 status:archived
/dare update dare_id:2 status:active theme:social
```

**Response:**

```
Dare #1 updated successfully!
Updated fields: content, status
```

**Permissions:** ManageMessages permission required (default cooldown: 3 seconds)

---

### `/dare delete`

**Description:** Permanently delete a dare from the database

**Usage:**

```
/dare delete dare_id:<id>
```

**Parameters:**

- `dare_id` (required) - The ID of the dare to delete

**Examples:**

```
/dare delete dare_id:1
```

**Response:**

```
Dare #1 deleted successfully!
```

**Permissions:** ManageMessages permission required (default cooldown: 3 seconds)

---

### `/dare complete`

**Description:** Mark a dare as completed with optional notes

**Usage:**

```
/dare complete dare_id:<id> [notes:<text>]
```

**Parameters:**

- `dare_id` (required) - The ID of the dare to mark as completed
- `notes` (optional) - Completion notes (max 1000 characters)

**Examples:**

```
/dare complete dare_id:1
/dare complete dare_id:1 notes:"Did it live on stream!"
```

**Response:**

```
Dare #1 marked as completed!
Completion notes: Did it live on stream!
Completed at: 2025-12-25 22:30:15
```

**Permissions:** Public (default cooldown: 3 seconds)

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
