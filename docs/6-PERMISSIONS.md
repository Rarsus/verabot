# 6. Permissions System

Comprehensive guide to VeraBot's permission control system.

---

## Permission Hierarchy

```
System Admin (Discord Server Owner)
  ├─ Role: @admin
  │   ├─ Can execute admin commands
  │   └─ Can grant/revoke permissions
  │
  ├─ Channel: #ops
  │   ├─ Commands allowed in this channel
  │   └─ Different permissions per channel
  │
  └─ User: @specific-user
      ├─ Direct user permissions
      └─ Override role permissions
```

---

## Permission Types

### 1. Role-Based

Allow command for entire Discord role

```
/allow-role deploy @developers     # All developers can deploy
```

### 2. User-Based

Allow command for specific user

```
/allow-user ping @john             # Only john can ping
```

### 3. Channel-Based

Allow command in specific channel

```
/allow-channel deploy #ops-channel # Only in #ops-channel
```

### 4. Global Deny

Block command for everyone

```
/deny-command dangerous-command    # No one can use
```

---

## Permission Precedence

When checking permissions:

```
1. Global Deny     - Block override (highest priority)
2. User Allow      - Specific user granted
3. Role Allow      - User's role granted
4. Channel Allow   - Current channel allowed
5. Public/Default  - Anyone can use
```

Example:

```
If user has deny-command permission, nothing allows it.
If admin, user, role, and channel all deny, user blocked.
If any one allows, user allowed (unless globally denied).
```

---

## Common Permission Scenarios

### Only Admins Can Deploy

```
/deny-command deploy          # Block globally
/allow-role deploy @admins    # Only admins
```

### Limited Channel Access

```
/allow-channel deploy #production  # Only in #production
/deny-channel deploy #general      # Never in #general
```

### Specific User Access

```
/allow-user dangerous-command @trusted-user
```

---

## Auditing Permissions

View all permission changes:

```
/audit
/audit --type permissions
/audit --user @john
/audit --limit 100
```

Shows who changed what and when.

---

## Next Steps

- [User Manual](./4-USER-MANUAL.md) - Using the bot
- [Command Reference](./5-COMMAND-REFERENCE.md) - All commands
- [Architecture](./7-ARCHITECTURE.md) - System design

---

**Previous:** [Command Reference](./5-COMMAND-REFERENCE.md) | **Next:** [Architecture](./7-ARCHITECTURE.md)
