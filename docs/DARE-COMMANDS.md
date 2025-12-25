# Dare Commands - Complete User Guide

> **Version:** 1.0.0 | **Last Updated:** December 2025

Complete documentation for VeraBot's dare command system, including AI-powered dare generation via Perchance.org, theme management, and complete CRUD operations.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
  - [Create Dare](#create-dare-createdare)
  - [List Dares](#list-dares-listdares)
  - [Get Dare](#get-dare-getdare)
  - [Give Dare](#give-dare-givedare)
  - [Update Dare](#update-dare-updatedare)
  - [Delete Dare](#delete-dare-deletedare)
  - [Complete Dare](#complete-dare-completedare)
- [Themes and Categories](#themes-and-categories)
- [Permission System](#permission-system)
- [Configuration](#configuration)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## Overview

The dare command suite provides a comprehensive system for managing AI-generated dares in your Discord server. Features include:

- **AI-Powered Generation:** Uses Perchance.org/api1 for creative, unique dares
- **Theme Support:** 6 built-in themes (general, humiliating, sexy, chastity, anal, funny)
- **Caching:** Intelligent caching reduces API calls and improves performance
- **Fallback System:** Automatic fallback to database when API is unavailable
- **Full CRUD:** Complete create, read, update, delete operations
- **Assignment Tracking:** Track which dares are assigned to which users
- **Status Management:** Active, completed, and archived dare states
- **Pagination:** Efficient browsing of large dare collections
- **Permission Controls:** Granular access control per command
- **Custom Generators:** Support for custom Perchance generators

---

## Quick Start

### Basic Usage

```
# Generate a new dare
/dare createdare

# List all dares
/dare listdares

# Get a specific dare by ID
/dare getdare id:1

# Give a random dare to a user
/dare givedare user:@User random:true

# Mark a dare as completed
/dare completedare id:1
```

### With Themes

```
# Generate a humiliating dare
/dare createdare theme:humiliating

# List only sexy dares
/dare listdares theme:sexy

# Give a random chastity dare
/dare givedare user:@User theme:chastity
```

---

## Command Reference

### Create Dare (`/dare createdare`)

Generate a new AI-powered dare from Perchance.org and store it in the database.

#### Syntax

```
/dare createdare [theme:<theme>] [generator:<name>]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `theme` | String | No | Theme/category for the dare (default: general) |
| `generator` | String | No | Custom Perchance generator name |

#### Available Themes

- `general` - Standard, all-purpose dares
- `humiliating` - Embarrassing, humiliation-based dares
- `sexy` - Adult, intimate dares
- `chastity` - Chastity-related challenges
- `anal` - Anal-related dares
- `funny` - Humorous, lighthearted dares

#### Examples

```
# Generate a general dare
/dare createdare

# Generate a humiliating dare
/dare createdare theme:humiliating

# Generate using custom generator
/dare createdare theme:sexy generator:my-custom-dare-gen

# Generate a funny dare
/dare createdare theme:funny
```

#### Response

```json
{
  "message": "Dare #42 created successfully!",
  "dareId": 42,
  "content": "Wear your underwear on the outside of your clothes for 1 hour",
  "theme": "humiliating",
  "source": "perchance",
  "fallback": false
}
```

#### Fallback Behavior

If the Perchance API is unavailable, the system will:
1. Log an error
2. Attempt to retrieve a random existing dare from the same theme
3. Return the fallback dare marked with `fallback: true`
4. If no fallback available, throw an error

#### Cooldown

5 seconds between uses per user.

---

### List Dares (`/dare listdares`)

List all dares in the database with filtering and pagination support.

#### Syntax

```
/dare listdares [status:<status>] [theme:<theme>] [page:<number>]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | No | Filter by status (active/completed/archived) |
| `theme` | String | No | Filter by theme |
| `page` | Integer | No | Page number for pagination (default: 1) |

#### Examples

```
# List all dares (first page)
/dare listdares

# List only active dares
/dare listdares status:active

# List humiliating dares on page 2
/dare listdares theme:humiliating page:2

# List completed sexy dares
/dare listdares theme:sexy status:completed

# Navigate to page 3
/dare listdares page:3
```

#### Response

```json
{
  "dares": [
    {
      "id": 1,
      "content": "Do 20 pushups",
      "theme": "general",
      "status": "active",
      "created_at": "2025-12-25T10:00:00Z"
    },
    // ... 9 more dares
  ],
  "count": 10,
  "totalCount": 47,
  "page": 1,
  "perPage": 10,
  "totalPages": 5,
  "message": "Found 10 dares (page 1/5, total 47)"
}
```

#### Pagination

- Default page size: 10 dares per page
- Navigate using `page` parameter
- Response includes `totalPages` for navigation

#### Cooldown

5 seconds between uses per user.

---

### Get Dare (`/dare getdare`)

Retrieve a specific dare by its ID.

#### Syntax

```
/dare getdare id:<number>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | The dare ID to retrieve |

#### Examples

```
# Get dare #1
/dare getdare id:1

# Get dare #42
/dare getdare id:42

# Get dare #100
/dare getdare id:100
```

#### Response

```json
{
  "dare": {
    "id": 42,
    "content": "Wear your underwear on the outside of your clothes for 1 hour",
    "theme": "humiliating",
    "status": "active",
    "source": "perchance",
    "created_by": "user123",
    "created_at": "2025-12-25T10:00:00Z",
    "assigned_to": null,
    "assigned_at": null,
    "completed_at": null
  }
}
```

#### Error Cases

- `Dare not found` - If the ID doesn't exist
- `Invalid dare ID` - If ID is not a positive integer

#### Cooldown

2 seconds between uses per user.

---

### Give Dare (`/dare givedare`)

Assign a dare to a specific Discord user.

#### Syntax

```
/dare givedare user:<user> [random:<true|false>] [dare_id:<id>] [theme:<theme>]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | User | Yes | Discord user to assign the dare to |
| `random` | Boolean | No | Give a random dare (default: true) |
| `dare_id` | Integer | No | Specific dare ID to assign |
| `theme` | String | No | Filter random dares by theme |

#### Examples

```
# Give a random dare to a user
/dare givedare user:@User

# Explicitly give a random dare
/dare givedare user:@User random:true

# Give a specific dare by ID
/dare givedare user:@User dare_id:42

# Give a random humiliating dare
/dare givedare user:@User theme:humiliating

# Give a random sexy dare
/dare givedare user:@User theme:sexy random:true
```

#### Response

```json
{
  "message": "Dare #42 assigned to user successfully!",
  "dareId": 42,
  "content": "Wear your underwear on the outside of your clothes for 1 hour",
  "theme": "humiliating",
  "assignedTo": "user789"
}
```

#### Assignment Tracking

When a dare is assigned:
- `assigned_to` field is set to the user's ID
- `assigned_at` timestamp is recorded
- User can track their dares
- Can be marked as completed by the assigned user

#### Error Cases

- `Target user is required` - If user parameter is missing
- `Dare #X not found` - If specific dare_id doesn't exist
- `No active dares available` - If no dares match criteria

#### Cooldown

3 seconds between uses per user.

---

### Update Dare (`/dare updatedare`)

Update an existing dare's content or status.

#### Syntax

```
/dare updatedare id:<number> [content:<text>] [status:<status>]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | The dare ID to update |
| `content` | String | No | New dare content text |
| `status` | String | No | New status (active/completed/archived) |

#### Status Values

- `active` - Dare is available for assignment
- `completed` - Dare has been completed
- `archived` - Dare is hidden from normal lists

#### Examples

```
# Update dare content
/dare updatedare id:42 content:"New dare text here"

# Mark dare as archived
/dare updatedare id:42 status:archived

# Update both content and status
/dare updatedare id:42 content:"Updated dare" status:active
```

#### Response

```json
{
  "message": "Dare #42 updated successfully",
  "updated": true
}
```

#### Restrictions

- Maximum content length: 2000 characters
- Only valid status values accepted
- Must be administrator to update

#### Error Cases

- `Invalid dare ID` - If ID is invalid
- `Dare not found` - If dare doesn't exist
- `Dare content is too long` - If content exceeds 2000 chars
- `Invalid status` - If status is not active/completed/archived

#### Cooldown

3 seconds between uses per user.

---

### Delete Dare (`/dare deletedare`)

Permanently delete a dare from the database.

#### Syntax

```
/dare deletedare id:<number>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | The dare ID to delete |

#### Examples

```
# Delete dare #1
/dare deletedare id:1

# Delete dare #42
/dare deletedare id:42
```

#### Response

```json
{
  "message": "Dare #42 deleted successfully",
  "deleted": true
}
```

#### Important Notes

⚠️ **Warning:** Deletion is permanent and cannot be undone!

- All associated data is removed
- Assignment history is lost
- Consider archiving instead for record keeping

#### Error Cases

- `Invalid dare ID` - If ID is invalid
- `Dare not found` - If dare doesn't exist

#### Cooldown

3 seconds between uses per user.

---

### Complete Dare (`/dare completedare`)

Mark a dare as completed with optional completion notes.

#### Syntax

```
/dare completedare id:<number> [notes:<text>]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | Yes | The dare ID to complete |
| `notes` | String | No | Optional notes about completion |

#### Examples

```
# Mark dare as completed
/dare completedare id:42

# Complete with notes
/dare completedare id:42 notes:"It was challenging but fun!"

# Complete with detailed notes
/dare completedare id:42 notes:"Completed on 2025-12-25. Everyone laughed!"
```

#### Response

```json
{
  "message": "Dare #42 marked as completed",
  "completed": true
}
```

#### Completion Rules

- Only the assigned user can complete their dare
- Sets `status` to "completed"
- Records `completed_at` timestamp
- Stores optional completion notes
- Cannot be re-completed once marked

#### Error Cases

- `Invalid dare ID` - If ID is invalid
- `Dare not found` - If dare doesn't exist
- `You can only complete dares assigned to you` - If not assigned to user

#### Cooldown

3 seconds between uses per user.

---

## Themes and Categories

### Available Themes

#### 1. General
**Code:** `general`  
**Description:** Standard, all-purpose dares suitable for any audience.

Examples:
- "Do 20 pushups"
- "Sing your favorite song"
- "Tell a joke to the group"

#### 2. Humiliating
**Code:** `humiliating`  
**Description:** Embarrassing, humiliation-based challenges.

Examples:
- "Wear your clothes backward for 1 hour"
- "Speak in a silly voice for 10 minutes"
- "Dance in public without music"

#### 3. Sexy
**Code:** `sexy`  
**Description:** Adult, intimate dares (18+ only).

Examples:
- "Send a flirty text to your partner"
- "Describe your fantasy"
- "Play truth or dare (adult version)"

#### 4. Chastity
**Code:** `chastity`  
**Description:** Chastity-related challenges and restrictions.

Examples:
- "No touching for 24 hours"
- "Wear your device for extended time"
- "Ask permission for everything"

#### 5. Anal
**Code:** `anal`  
**Description:** Anal-related dares (18+ only).

Examples:
- "Wear your plug for 1 hour"
- "Practice your exercises"
- "Try a new position"

#### 6. Funny
**Code:** `funny`  
**Description:** Humorous, lighthearted, comedy-focused dares.

Examples:
- "Talk like a pirate for 10 minutes"
- "Make up a ridiculous story"
- "Do your best celebrity impression"

### Theme Customization

Themes can be customized in the configuration. See [Dare Configuration Guide](./DARE-CONFIGURATION.md) for details.

---

## Permission System

All dare commands support VeraBot's comprehensive permission system.

### Permission Categories

Dare commands are in the `dares` category for permission management.

### Granting Access

```
# Allow dare commands globally
/admin allow command:createdare

# Allow for specific role
/admin allowrole command:givedare role:@DareMaster

# Allow for specific user
/admin allowuser command:deletedare user:@Admin

# Allow in specific channel
/admin allowchannel command:listdares channel:#dares
```

### Checking Permissions

```
# View allowed commands
/admin allowed category:dares

# View audit log
/admin audit limit:50
```

### Default Permissions

By default, no dare commands are enabled. Server administrators must explicitly allow them.

---

## Configuration

### Environment Variables

```env
# Perchance generator name (default: dare-generator)
PERCHANCE_DARE_GENERATOR=dare-generator

# Dare themes (comma-separated, default: general,humiliating,sexy,chastity,anal,funny)
DARE_THEMES=general,humiliating,sexy,chastity,anal,funny

# Enable caching (default: true)
DARE_CACHE_ENABLED=true

# Cache TTL in seconds (default: 3600 = 1 hour)
DARE_CACHE_TTL=3600
```

### Configuration File

Edit `src/infra/config/Config.js`:

```javascript
const ConfigSchema = z.object({
  // ... other config ...
  PERCHANCE_DARE_GENERATOR: z.string().default('dare-generator'),
  DARE_THEMES: z.array(z.string()).default([
    'general', 'humiliating', 'sexy', 'chastity', 'anal', 'funny'
  ]),
  DARE_CACHE_ENABLED: z.boolean().default(true),
  DARE_CACHE_TTL: z.number().default(3600),
});
```

### Configuration Hierarchy

1. **Command Parameter** (highest priority) - `/dare createdare generator:my-gen`
2. **Environment Variable** - `PERCHANCE_DARE_GENERATOR=my-gen`
3. **Config File Default** (lowest priority) - `default('dare-generator')`

For detailed configuration guide, see [DARE-CONFIGURATION.md](./DARE-CONFIGURATION.md).

---

## Advanced Usage

### Custom Generators

Use your own Perchance generator:

```
# Create dare with custom generator
/dare createdare generator:my-custom-generator theme:general
```

Your custom generator must:
- Be accessible at `https://perchance.org/api1/your-generator-name`
- Return JSON with `result`, `output`, `text`, `dare`, or `content` field
- OR return plain text

### Bulk Operations

While there's no bulk command, you can script operations using the API:

```bash
# Example: Create 10 dares with different themes
for theme in general humiliating sexy funny; do
  /dare createdare theme:$theme
done
```

### Integration with Other Systems

Dare data can be accessed via:
- Database queries (SQLite)
- Discord bot events
- Custom integrations via code

---

## Troubleshooting

### Common Issues

#### "No active dares available"

**Cause:** Database has no dares matching the criteria.

**Solution:**
```
# Create some dares first
/dare createdare
/dare createdare theme:humiliating
/dare createdare theme:sexy
```

#### "Failed to generate dare from Perchance API"

**Cause:** Perchance.org is down or rate limiting.

**Solution:** The system will automatically use fallback dares from the database. If this persists:
- Check your internet connection
- Verify Perchance.org is accessible
- Wait and try again later

#### "Invalid theme 'xyz'"

**Cause:** Theme not in configured list.

**Solution:**
```
# Use a valid theme
/dare createdare theme:general

# Or configure custom themes in config file
```

#### "Permission denied"

**Cause:** Command not allowed for your role/user/channel.

**Solution:**
```
# Ask admin to grant permission
/admin allow command:createdare
```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

This will log:
- API calls to Perchance
- Cache hits/misses
- Database operations
- Permission checks

---

## Examples

### Complete Workflow Example

```
# 1. Admin enables dare commands
/admin allow command:createdare
/admin allow command:givedare
/admin allow command:completedare

# 2. Create some dares
/dare createdare theme:general
/dare createdare theme:humiliating
/dare createdare theme:funny

# 3. Give a dare to a user
/dare givedare user:@Alice random:true theme:funny

# 4. Alice completes the dare
/dare completedare id:42 notes:"That was hilarious!"

# 5. Check dare list
/dare listdares status:completed
```

### Server Setup Example

```
# 1. Configure permissions for dare channel
/admin allowchannel command:createdare channel:#dares
/admin allowchannel command:givedare channel:#dares
/admin allowchannel command:listdares channel:#dares

# 2. Give DareMaster role full access
/admin allowrole command:createdare role:@DareMaster
/admin allowrole command:givedare role:@DareMaster
/admin allowrole command:updatedare role:@DareMaster
/admin allowrole command:deletedare role:@DareMaster

# 3. Create initial dare pool
/dare createdare theme:general
/dare createdare theme:general
/dare createdare theme:funny
```

---

## Best Practices

### For Server Administrators

1. **Start with General Themes:** Begin with `general` and `funny` themes
2. **Set Clear Rules:** Define acceptable dare boundaries
3. **Monitor Usage:** Review audit logs regularly
4. **Limit Sensitive Themes:** Restrict adult themes to 18+ channels
5. **Create Dare Pool:** Build a collection before giving random dares

### For Users

1. **Read the Dare:** Understand what's expected before accepting
2. **Set Boundaries:** Use themes that match your comfort level
3. **Complete Promptly:** Mark dares as completed when done
4. **Add Notes:** Include completion notes for posterity
5. **Have Fun:** Dares should be enjoyable!

### Technical Best Practices

1. **Cache Configuration:** Enable caching for better performance
2. **Fallback Pool:** Maintain a good collection of database dares
3. **Theme Organization:** Use themes consistently
4. **Regular Cleanup:** Archive old/stale dares
5. **Backup Database:** Regular backups of dare data

---

## FAQ

### Can I use my own Perchance generator?

Yes! Use the `generator` parameter:
```
/dare createdare generator:my-custom-generator
```

### How do I add new themes?

Edit the `DARE_THEMES` environment variable or configuration file. Restart the bot to apply changes.

### What happens if Perchance is down?

The system automatically falls back to random dares from the database with the same theme.

### Can I recover deleted dares?

No, deletion is permanent. Consider using `status:archived` instead for soft deletion.

### How long are dares cached?

Default is 1 hour (3600 seconds). Configurable via `DARE_CACHE_TTL`.

### Can users create their own dares?

Not through commands, but administrators can use `/dare updatedare` to add custom content.

### Is there a dare limit?

No hard limit, but database performance may degrade with very large collections (&gt;10,000 dares).

### Can I export dares?

Yes, via direct SQLite database access. See [Database Documentation](./7-ARCHITECTURE.md).

---

## Related Documentation

- [Dare Configuration Guide](./DARE-CONFIGURATION.md) - Detailed configuration
- [Permission System](./6-PERMISSIONS.md) - Permission management
- [Command Reference](./5-COMMAND-REFERENCE.md) - All bot commands
- [Architecture](./7-ARCHITECTURE.md) - System architecture

---

## Support

For issues or questions:
1. Check this documentation
2. Review [Troubleshooting](#troubleshooting)
3. Check GitHub Issues
4. Contact server administrators

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**License:** MIT
