const Database = require('better-sqlite3');

function createDb(config, logger) {
  const db = new Database('commands.db');

  db.exec(`
    CREATE TABLE IF NOT EXISTS allowed_commands (
      command TEXT PRIMARY KEY,
      added_by TEXT,
      added_at TEXT
    );
    CREATE TABLE IF NOT EXISTS command_roles (
      command TEXT,
      role_id TEXT,
      PRIMARY KEY (command, role_id)
    );
    CREATE TABLE IF NOT EXISTS command_channels (
      command TEXT,
      channel_id TEXT,
      PRIMARY KEY (command, channel_id)
    );
    CREATE TABLE IF NOT EXISTS command_users (
      command TEXT,
      user_id TEXT,
      PRIMARY KEY (command, user_id)
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      command TEXT,
      user TEXT,
      channel TEXT,
      timestamp TEXT,
      args TEXT,
      success INTEGER
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      command TEXT PRIMARY KEY,
      last_used INTEGER
    );
  `);

  logger.info('SQLite schema ready');

  return {
    raw: db,
    isConnected: () => true,
    close: async () => db.close()
  };
}

module.exports = { createDb };
