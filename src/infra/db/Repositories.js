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
 * Create quote repository for managing quotes
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Quote repository with methods for CRUD operations
 * @private
 */
function createQuoteRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Add a new quote
     * @param {string} text - Quote text
     * @param {string} author - Quote author
     * @param {string} addedBy - User ID who added the quote
     * @returns {Promise<number>} The ID of the newly created quote
     */
    async add(text, author, addedBy) {
      const result = conn
        .prepare(
          'INSERT INTO quotes (text, author, added_by, added_at) VALUES (?, ?, ?, datetime("now"))',
        )
        .run(text, author, addedBy);
      return result.lastInsertRowid;
    },
    /**
     * Get all quotes
     * @returns {Promise<Array>} Array of all quotes
     */
    async getAll() {
      return conn.prepare('SELECT * FROM quotes ORDER BY id ASC').all();
    },
    /**
     * Get a quote by ID
     * @param {number} id - Quote ID
     * @returns {Promise<Object|null>} Quote object or null if not found
     */
    async getById(id) {
      return conn.prepare('SELECT * FROM quotes WHERE id = ?').get(id) || null;
    },
    /**
     * Get a random quote
     * @returns {Promise<Object|null>} Random quote object or null if no quotes exist
     */
    async getRandom() {
      return conn.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get() || null;
    },
    /**
     * Search quotes by text or author
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching quotes
     */
    async search(query) {
      const searchPattern = `%${query}%`;
      return conn
        .prepare('SELECT * FROM quotes WHERE text LIKE ? OR author LIKE ? ORDER BY id DESC')
        .all(searchPattern, searchPattern);
    },
    /**
     * Get the count of all quotes
     * @returns {Promise<number>} Total number of quotes
     */
    async count() {
      const row = conn.prepare('SELECT COUNT(*) as count FROM quotes').get();
      return row ? row.count : 0;
    },
  };
}

/**
 * Create dare repository for managing dares
 * @param {Object} db - Database instance with raw connection
 * @returns {Object} Dare repository with methods for CRUD operations
 * @private
 */
function createDareRepository(db) {
  const conn = db.raw;
  return {
    /**
     * Add a new dare
     * @param {string} content - Dare content text
     * @param {string} source - Source of dare ('perchance' or 'user')
     * @param {string} createdBy - User ID who created the dare
     * @returns {Promise<number>} The ID of the newly created dare
     */
    async add(content, source, createdBy) {
      const result = conn
        .prepare(
          'INSERT INTO dares (content, source, created_by, created_at) VALUES (?, ?, ?, datetime("now"))',
        )
        .run(content, source, createdBy);
      return result.lastInsertRowid;
    },
    /**
     * Get all dares
     * @param {Object} filters - Optional filters
     * @param {string} [filters.status] - Filter by status
     * @param {string} [filters.assignedTo] - Filter by assigned user
     * @returns {Promise<Array>} Array of all dares
     */
    async getAll(filters = {}) {
      let query = 'SELECT * FROM dares';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters.assignedTo) {
        conditions.push('assigned_to = ?');
        params.push(filters.assignedTo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      return conn.prepare(query).all(...params);
    },
    /**
     * Get a dare by ID
     * @param {number} id - Dare ID
     * @returns {Promise<Object|null>} Dare object or null if not found
     */
    async getById(id) {
      return conn.prepare('SELECT * FROM dares WHERE id = ?').get(id) || null;
    },
    /**
     * Get a random dare
     * @param {Object} filters - Optional filters
     * @param {string} [filters.status] - Filter by status
     * @returns {Promise<Object|null>} Random dare object or null if no dares exist
     */
    async getRandom(filters = {}) {
      let query = 'SELECT * FROM dares';
      const params = [];

      if (filters.status) {
        query += ' WHERE status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY RANDOM() LIMIT 1';

      return conn.prepare(query).get(...params) || null;
    },
    /**
     * Update a dare
     * @param {number} id - Dare ID
     * @param {Object} updates - Fields to update
     * @param {string} [updates.content] - New content
     * @param {string} [updates.status] - New status
     * @param {string} [updates.assignedTo] - User ID to assign to
     * @param {string} [updates.completedAt] - Completion timestamp
     * @param {string} [updates.completionNotes] - Completion notes
     * @returns {Promise<boolean>} True if updated, false if not found
     */
    async update(id, updates) {
      const fields = [];
      const params = [];

      if (updates.content !== undefined) {
        fields.push('content = ?');
        params.push(updates.content);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        params.push(updates.status);
      }
      if (updates.assignedTo !== undefined) {
        fields.push('assigned_to = ?');
        params.push(updates.assignedTo);
      }
      if (updates.completedAt !== undefined) {
        fields.push('completed_at = ?');
        params.push(updates.completedAt);
      }
      if (updates.completionNotes !== undefined) {
        fields.push('completion_notes = ?');
        params.push(updates.completionNotes);
      }

      if (fields.length === 0) {
        return false;
      }

      params.push(id);
      const query = `UPDATE dares SET ${fields.join(', ')} WHERE id = ?`;
      const result = conn.prepare(query).run(...params);
      return result.changes > 0;
    },
    /**
     * Delete a dare
     * @param {number} id - Dare ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
      const result = conn.prepare('DELETE FROM dares WHERE id = ?').run(id);
      return result.changes > 0;
    },
    /**
     * Get the count of all dares
     * @param {Object} filters - Optional filters
     * @param {string} [filters.status] - Filter by status
     * @returns {Promise<number>} Total number of dares
     */
    async count(filters = {}) {
      let query = 'SELECT COUNT(*) as count FROM dares';
      const params = [];

      if (filters.status) {
        query += ' WHERE status = ?';
        params.push(filters.status);
      }

      const row = conn.prepare(query).get(...params);
      return row ? row.count : 0;
    },
  };
}

/**
 * Create all repository instances
 * Factory function initializing command, permission, audit, rate limit, quote, and dare repositories
 * @param {Object} db - Database instance
 * @param {Object} logger - Logger instance
 * @returns {Object} Object containing all repositories
 * @returns {Object} returns.commandRepo - Command management repository
 * @returns {Object} returns.permissionRepo - Permission management repository
 * @returns {Object} returns.auditRepo - Audit logging repository
 * @returns {Object} returns.rateLimitRepo - Rate limiting repository
 * @returns {Object} returns.quoteRepo - Quote management repository
 * @returns {Object} returns.dareRepo - Dare management repository
 * @example
 * const repositories = createRepositories(db, logger);
 * const isAllowed = await repositories.commandRepo.isAllowed('ping');
 * await repositories.permissionRepo.addRole('ping', 'admin_role_id');
 * const quotes = await repositories.quoteRepo.getAll();
 * const dares = await repositories.dareRepo.getAll();
 */
function createRepositories(db, logger) {
  logger.info('Creating repositories');
  return {
    commandRepo: createCommandRepository(db),
    permissionRepo: createPermissionRepository(db),
    auditRepo: createAuditRepository(db),
    rateLimitRepo: createRateLimitRepository(db),
    quoteRepo: createQuoteRepository(db),
    dareRepo: createDareRepository(db),
  };
}

module.exports = { createRepositories };
