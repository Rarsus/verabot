function createCommandRepository(db) {
  const conn = db.raw;
  return {
    async isAllowed(command) {
      const row = conn.prepare('SELECT 1 FROM allowed_commands WHERE command = ?').get(command);
      return !!row;
    },
    async listAllowed() {
      return conn.prepare('SELECT * FROM allowed_commands ORDER BY command').all();
    },
    async addAllowed(command, addedBy) {
      conn
        .prepare(
          'INSERT OR IGNORE INTO allowed_commands (command, added_by, added_at) VALUES (?, ?, datetime("now"))'
        )
        .run(command, addedBy);
    },
    async removeAllowed(command) {
      conn.prepare('DELETE FROM allowed_commands WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_roles WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_channels WHERE command = ?').run(command);
      conn.prepare('DELETE FROM command_users WHERE command = ?').run(command);
      conn.prepare('DELETE FROM rate_limits WHERE command = ?').run(command);
    }
  };
}

function createPermissionRepository(db) {
  const conn = db.raw;
  return {
    async isAllowed(command) {
      const row = conn.prepare('SELECT 1 FROM allowed_commands WHERE command = ?').get(command);
      return !!row;
    },
    async getRoles(command) {
      return conn
        .prepare('SELECT role_id FROM command_roles WHERE command = ?')
        .all(command)
        .map(r => r.role_id);
    },
    async getChannels(command) {
      return conn
        .prepare('SELECT channel_id FROM command_channels WHERE command = ?')
        .all(command)
        .map(r => r.channel_id);
    },
    async getUsers(command) {
      return conn
        .prepare('SELECT user_id FROM command_users WHERE command = ?')
        .all(command)
        .map(r => r.user_id);
    },
    async addRole(command, roleId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_roles (command, role_id) VALUES (?, ?)')
        .run(command, roleId);
    },
    async addChannel(command, channelId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_channels (command, channel_id) VALUES (?, ?)')
        .run(command, channelId);
    },
    async addUser(command, userId) {
      conn
        .prepare('INSERT OR IGNORE INTO command_users (command, user_id) VALUES (?, ?)')
        .run(command, userId);
    },
    async listAudit(limit = 50) {
      return conn
        .prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?')
        .all(limit);
    }
  };
}

function createAuditRepository(db) {
  const conn = db.raw;
  return {
    async log(command, result) {
      conn
        .prepare(
          'INSERT INTO audit_log (source, command, user, channel, timestamp, args, success) VALUES (?, ?, ?, ?, datetime("now"), ?, ?)'
        )
        .run(
          command.source,
          command.name,
          command.userId || null,
          command.channelId || null,
          JSON.stringify(command.args || []),
          result.success ? 1 : 0
        );
    }
  };
}

function createRateLimitRepository(db) {
  const conn = db.raw;
  return {
    async getLastUsed(command) {
      const row = conn.prepare('SELECT last_used FROM rate_limits WHERE command = ?').get(command);
      return row ? row.last_used : null;
    },
    async setLastUsed(command, timestamp) {
      conn
        .prepare(
          'INSERT INTO rate_limits (command, last_used) VALUES (?, ?) ON CONFLICT(command) DO UPDATE SET last_used = excluded.last_used'
        )
        .run(command, timestamp);
    }
  };
}

function createRepositories(db, logger) {
  logger.info('Creating repositories');
  return {
    commandRepo: createCommandRepository(db),
    permissionRepo: createPermissionRepository(db),
    auditRepo: createAuditRepository(db),
    rateLimitRepo: createRateLimitRepository(db)
  };
}

module.exports = { createRepositories };
