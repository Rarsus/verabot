/**
 * Create command repository for managing allowed commands
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Command repository with methods: isAllowed, listAllowed, addAllowed, removeAllowed
 * @private
 */
function createCommandRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Check if a command is allowed
     * @param {string} command - Command name to check
     * @returns {Promise<boolean>} True if command is allowed
     */
    async isAllowed(command) {
      const row = conn.prepare('SELECT 1 FROM allowed_commands WHERE command = ?').get(command);
      return !!row;
    },
    /**
     * List all allowed commands
     * @returns {Promise<Array>} Array of allowed command objects
     */
    async listAllowed() {
      return conn.prepare('SELECT * FROM allowed_commands ORDER BY command').all();
    },
    /**
     * Add a command to allowed list
     * @param {string} command - Command name to allow
     * @param {string} addedBy - ID of user who added the command
     * @returns {Promise<void>}
     */
    async addAllowed(command, addedBy) {
      conn
        .prepare(
          'INSERT OR IGNORE INTO allowed_commands (command, added_by, added_at) VALUES (?, ?, datetime("now"))',
        )
        .run(command, addedBy);
    },
    /**
     * Remove a command and all related permissions
     * @param {string} command - Command name to remove
     * @returns {Promise<void>}
     */
    async removeAllowed(command) {
      conn.prepare('DELETE FROM allowed_commands WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_roles WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_channels WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_users WHERE command = ?').run(command);
      conn.prepare('DELETE FROM rate_limits WHERE command = ?').run(command);
    },
  };
}

/**
 * Create permission repository for managing command permissions
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Permission repository with methods for role, channel, and user permissions
 * @private
 */
function createPermissionRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Check if a command is allowed
     * @param {string} command - Command name to check
     * @returns {Promise<boolean>} True if command is allowed
     */
    async isAllowed(command) {
      const row = conn.prepare('SELECT 1 FROM allowed_commands WHERE command = ?').get(command);
      return !!row;
    },
    /**
     * Get all roles allowed for a command
     * @param {string} command - Command name
     * @returns {Promise<Array<string>>} Array of role IDs
     */
    async getRoles(command) {
      return conn
        .prepare('SELECT role_id FROM command_roles WHERE command = ?')
        .all(command)
        .map((r) => r.role_id);
    },
    /**
     * Get all channels allowed for a command
     * @param {string} command - Command name
     * @returns {Promise<Array<string>>} Array of channel IDs
     */
    async getChannels(command) {
      return conn
        .prepare('SELECT channel_id FROM command_channels WHERE command = ?')
        .all(command)
        .map((r) => r.channel_id);
    },
    /**
     * Get all users allowed for a command
     * @param {string} command - Command name
     * @returns {Promise<Array<string>>} Array of user IDs
     */
    async getUsers(command) {
      return conn
        .prepare('SELECT user_id FROM command_users WHERE command = ?')
        .all(command)
        .map((r) => r.user_id);
    },
    /**
     * Add role permission for a command
     * @param {string} command - Command name
     * @param {string} roleId - Role ID to allow
     * @returns {Promise<void>}
     */
    async addRole(command, roleId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_roles (command, role_id) VALUES (?, ?)')
        .run(command, roleId);
    },
    /**
     * Add channel permission for a command
     * @param {string} command - Command name
     * @param {string} channelId - Channel ID to allow
     * @returns {Promise<void>}
     */
    async addChannel(command, channelId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_channels (command, channel_id) VALUES (?, ?)')
        .run(command, channelId);
    },
    /**
     * Add user permission for a command
     * @param {string} command - Command name
     * @param {string} userId - User ID to allow
     * @returns {Promise<void>}
     */
    async addUser(command, userId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_users (command, user_id) VALUES (?, ?)')
        .run(command, userId);
    },
    /**
     * List audit log entries
     * @param {number} limit - Maximum number of entries to return (default: 50)
     * @returns {Promise<Array>} Array of audit log entries
     */
    async listAudit(limit = 50) {
      return conn.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
    },
  };
}

/**
 * Create audit repository for logging command execution
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Audit repository with log method
 * @private
 */
function createAuditRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Log a command execution
     * @param {Command} command - Command object with name, source, userId, channelId, args
     * @param {CommandResult} result - Command execution result
     * @returns {Promise<void>}
     */
    async log(command, result) {
      conn
        .prepare(
          'INSERT INTO audit_log (source, command, user, channel, timestamp, args, success) VALUES (?, ?, ?, ?, datetime("now"), ?, ?)',
        )
        .run(
          command.source,
          command.name,
          command.userId || null,
          command.channelId || null,
          JSON.stringify(command.args || []),
          result.success ? 1 : 0,
        );
    },
  };
}

/**
 * Create rate limit repository for tracking command usage
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Rate limit repository with methods: getLastUsed, setLastUsed
 * @private
 */
function createRateLimitRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Get last usage timestamp for a command
     * @param {string} command - Command name
     * @returns {Promise<number|null>} Unix timestamp or null if never used
     */
    async getLastUsed(command) {
      const row = conn.prepare('SELECT last_used FROM rate_limits WHERE command = ?').get(command);
      return row ? row.last_used : null;
    },
    /**
     * Set last usage timestamp for a command
     * @param {string} command - Command name
     * @param {number} timestamp - Unix timestamp of usage
     * @returns {Promise<void>}
     */
    async setLastUsed(command, timestamp) {
      conn
        .prepare(
          'INSERT INTO rate_limits (command, last_used) VALUES (?, ?) ON CONFLICT(command) DO UPDATE SET last_used = excluded.last_used',
        )
        .run(command, timestamp);
    },
  };
}

/**
 * Create all repository instances
 * Factory function initializing command, permission, audit, and rate limit repositories
 * @param {Object} db - Database instance
 * @param {Object} logger - Logger instance
 * @returns {Object} Object containing all repositories
 * @returns {Object} returns.commandRepo - Command management repository
 * @returns {Object} returns.permissionRepo - Permission management repository
 * @returns {Object} returns.auditRepo - Audit logging repository
 * @returns {Object} returns.rateLimitRepo - Rate limiting repository
 * @example
 * const repositories = createRepositories(db, logger);
 * const isAllowed = await repositories.commandRepo.isAllowed('ping');
 * await repositories.permissionRepo.addRole('ping', 'admin_role_id');
 */
function createRepositories(db, logger) {
  logger.info('Creating repositories');
  return {
    commandRepo: createCommandRepository(db),
    permissionRepo: createPermissionRepository(db),
    auditRepo: createAuditRepository(db),
    rateLimitRepo: createRateLimitRepository(db),
  };
}

module.exports = { createRepositories };
