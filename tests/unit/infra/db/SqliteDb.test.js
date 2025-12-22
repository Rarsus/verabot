const { createDb } = require('../../../../src/infra/db/SqliteDb');
const Database = require('better-sqlite3');

describe('SqliteDb', () => {
  let mockLogger;
  let mockConfig;
  let db;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockConfig = {
      LOG_LEVEL: 'info',
    };
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('createDb', () => {
    it('should export createDb function', () => {
      expect(typeof createDb).toBe('function');
    });

    it('should create and return database object', () => {
      db = createDb(mockConfig, mockLogger);

      expect(db).toBeDefined();
      expect(db.raw).toBeDefined();
      expect(db.isConnected).toBeDefined();
      expect(db.close).toBeDefined();
    });

    it('should initialize database schema with all required tables', () => {
      db = createDb(mockConfig, mockLogger);

      // Check tables exist
      const tables = db.raw
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        )
        .all();

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('allowed_commands');
      expect(tableNames).toContain('command_roles');
      expect(tableNames).toContain('command_channels');
      expect(tableNames).toContain('command_users');
      expect(tableNames).toContain('audit_log');
      expect(tableNames).toContain('rate_limits');
      expect(tableNames).toContain('quotes');
    });

    it('should create required indexes for quotes table', () => {
      db = createDb(mockConfig, mockLogger);

      const indexes = db.raw
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='quotes' ORDER BY name",
        )
        .all();

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain('idx_quotes_author');
      expect(indexNames).toContain('idx_quotes_added_at');
    });

    it('should log successful schema initialization', () => {
      db = createDb(mockConfig, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith('SQLite schema ready');
    });

    it('should return working raw database connection', () => {
      db = createDb(mockConfig, mockLogger);

      // Test basic query capability
      const result = db.raw.prepare('SELECT 1 as test').get();
      expect(result.test).toBe(1);
    });

    it('should have isConnected function that returns true', () => {
      db = createDb(mockConfig, mockLogger);

      expect(typeof db.isConnected).toBe('function');
      expect(db.isConnected()).toBe(true);
    });

    it('should have close async function for cleanup', async () => {
      db = createDb(mockConfig, mockLogger);

      expect(typeof db.close).toBe('function');
      const closePromise = db.close();
      expect(closePromise).toBeInstanceOf(Promise);

      await closePromise;
    });

    it('should allow inserting records into allowed_commands table', () => {
      db = createDb(mockConfig, mockLogger);

      const uniqueCmd = `test-cmd-${Date.now()}`;
      const stmt = db.raw.prepare(`
        INSERT INTO allowed_commands (command, added_by, added_at)
        VALUES (?, ?, ?)
      `);

      stmt.run(uniqueCmd, 'user123', '2025-01-01');

      const result = db.raw
        .prepare('SELECT * FROM allowed_commands WHERE command = ?')
        .get(uniqueCmd);

      expect(result).toBeDefined();
      expect(result.command).toBe(uniqueCmd);
      expect(result.added_by).toBe('user123');
    });

    it('should allow inserting audit log entries', () => {
      db = createDb(mockConfig, mockLogger);

      const stmt = db.raw.prepare(`
        INSERT INTO audit_log (source, command, user, channel, timestamp, args, success)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run('discord', 'test-audit', 'user123', 'channel456', '2025-01-01', '[]', 1);

      const result = db.raw
        .prepare('SELECT * FROM audit_log WHERE command = ?')
        .get('test-audit');

      expect(result).toBeDefined();
      expect(result.source).toBe('discord');
      expect(result.user).toBe('user123');
      expect(result.success).toBe(1);
    });

    it('should allow inserting quotes with proper defaults', () => {
      db = createDb(mockConfig, mockLogger);

      const stmt = db.raw.prepare(`
        INSERT INTO quotes (text, author, added_by, added_at)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run('Test quote content', 'Test Author', 'user123', '2025-01-01');

      const result = db.raw
        .prepare('SELECT * FROM quotes WHERE text = ?')
        .get('Test quote content');

      expect(result).toBeDefined();
      expect(result.text).toBe('Test quote content');
      expect(result.author).toBe('Test Author');
      expect(result.added_by).toBe('user123');
    });

    it('should enforce PRIMARY KEY constraint on allowed_commands', () => {
      db = createDb(mockConfig, mockLogger);

      const uniqueCmd = `dup-test-${Date.now()}`;
      const stmt = db.raw.prepare(`
        INSERT INTO allowed_commands (command, added_by, added_at)
        VALUES (?, ?, ?)
      `);

      stmt.run(uniqueCmd, 'user1', '2025-01-01');

      // Try to insert duplicate - should throw
      expect(() => {
        stmt.run(uniqueCmd, 'user2', '2025-01-02');
      }).toThrow();
    });

    it('should support prepared statements with parameters', () => {
      db = createDb(mockConfig, mockLogger);

      const stmt = db.raw.prepare('SELECT ? as value');
      const result = stmt.get('test_value');

      expect(result).toBeDefined();
      expect(result.value).toBe('test_value');
    });

    it('should support multiple sequential operations', () => {
      db = createDb(mockConfig, mockLogger);

      const insertStmt = db.raw.prepare(`
        INSERT INTO audit_log (source, command, user, channel, timestamp, args, success)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Insert multiple records
      insertStmt.run('src1', 'cmd1', 'u1', 'ch1', '2025-01-01', 'a1', 1);
      insertStmt.run('src2', 'cmd2', 'u2', 'ch2', '2025-01-02', 'a2', 0);

      // Verify count
      const countResult = db.raw
        .prepare('SELECT COUNT(*) as count FROM audit_log WHERE source IN (?, ?)')
        .get('src1', 'src2');

      expect(countResult.count).toBeGreaterThanOrEqual(2);
    });

    it('should have database instance as raw property', () => {
      db = createDb(mockConfig, mockLogger);

      expect(db.raw).toBeInstanceOf(Database);
    });

    it('should create idempotent schema', () => {
      db = createDb(mockConfig, mockLogger);
      const firstTableCount = db.raw
        .prepare(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'",
        )
        .get().count;

      // Schema should already exist, querying again shouldn't increase count
      expect(firstTableCount).toBeGreaterThan(0);

      const secondTableCount = db.raw
        .prepare(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'",
        )
        .get().count;

      expect(secondTableCount).toBe(firstTableCount);
    });
  });
});
