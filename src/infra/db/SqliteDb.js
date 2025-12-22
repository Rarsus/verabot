const Database = require('better-sqlite3');

/**
 * Create and initialize SQLite database connection
 * Sets up schema with tables for allowed commands, permissions, audit log, and rate limiting
 * @param {Object} config - Application configuration (not directly used but available for future expansion)
 * @param {Object} logger - Logger instance for logging initialization
 * @returns {Object} Database wrapper object
 * @returns {Database} returns.raw - Raw better-sqlite3 database instance for queries
 * @returns {Function} returns.isConnected - Function returning connection status (always true for SQLite)
 * @returns {Function} returns.close - Async function to close database connection
 * @example
 * const db = createDb(config, logger);
 * const commands = db.raw.prepare('SELECT * FROM allowed_commands').all();
 * await db.close();
 */
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
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Anonymous',
      added_by TEXT,
      added_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author);
    CREATE INDEX IF NOT EXISTS idx_quotes_added_at ON quotes(added_at);
  `);

  logger.info('SQLite schema ready');

  return {
    raw: db,
    isConnected: () => true,
    close: async () => db.close(),
  };
}

module.exports = { createDb };
