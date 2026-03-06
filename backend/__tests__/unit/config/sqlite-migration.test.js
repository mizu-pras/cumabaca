const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('SQLite schema migration', () => {
  let tempDir;
  let tempDbPath;
  let originalEnv;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cumabaca-test-'));
    tempDbPath = path.join(tempDir, 'test-admin.db');
    originalEnv = process.env.SQLITE_PATH;
  });

  afterAll(() => {
    // Clean up temp DB files
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // Restore env
    if (originalEnv !== undefined) {
      process.env.SQLITE_PATH = originalEnv;
    } else {
      delete process.env.SQLITE_PATH;
    }
  });

  beforeEach(() => {
    // Clean up any existing DB so each test starts fresh
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
    // Reset module cache so initDatabase runs fresh each time
    jest.resetModules();
    process.env.SQLITE_PATH = tempDbPath;
  });

  async function getDb() {
    const sqlite = require('../../../config/sqlite');
    return await sqlite.init();
  }

  function getTableNames(db) {
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    if (result.length === 0) return [];
    return result[0].values.map(row => row[0]);
  }

  function getColumnNames(db, tableName) {
    const result = db.exec(`PRAGMA table_info(${tableName})`);
    if (result.length === 0) return [];
    return result[0].values.map(row => row[1]);
  }

  function getIndexNames(db) {
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    if (result.length === 0) return [];
    return result[0].values.map(row => row[0]);
  }

  describe('fresh database', () => {
    it('creates chapters table with correct columns', async () => {
      const db = await getDb();
      const tables = getTableNames(db);
      expect(tables).toContain('chapters');

      const columns = getColumnNames(db, 'chapters');
      expect(columns).toEqual(expect.arrayContaining([
        'id', 'komik_website_id', 'chapter_number', 'url',
        'created_at', 'updated_at'
      ]));
    });

    it('creates pages table with correct columns', async () => {
      const db = await getDb();
      const tables = getTableNames(db);
      expect(tables).toContain('pages');

      const columns = getColumnNames(db, 'pages');
      expect(columns).toEqual(expect.arrayContaining([
        'id', 'chapter_id', 'page_number', 'image_url',
        'created_at', 'updated_at'
      ]));
    });

    it('creates indexes for chapters and pages', async () => {
      const db = await getDb();
      const indexes = getIndexNames(db);
      expect(indexes).toEqual(expect.arrayContaining([
        'idx_chapters_komik_website',
        'idx_chapters_number',
        'idx_pages_chapter'
      ]));
    });

    it('adds cover and synopsis columns to komik_websites', async () => {
      const db = await getDb();
      const columns = getColumnNames(db, 'komik_websites');
      expect(columns).toContain('cover');
      expect(columns).toContain('synopsis');
    });
  });

  describe('existing database (schema applied to pre-existing DB)', () => {
    it('applies schema to an existing database that was loaded from disk', async () => {
      // Step 1: Create a DB with only admin_users table (simulating old DB)
      const SQL = await initSqlJs();
      const oldDb = new SQL.Database();
      oldDb.run(`
        CREATE TABLE admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        );
      `);
      // Save old DB to disk
      const data = oldDb.export();
      fs.writeFileSync(tempDbPath, Buffer.from(data));
      oldDb.close();

      // Step 2: Load via initDatabase — schema should be applied
      const db = await getDb();
      const tables = getTableNames(db);
      expect(tables).toContain('chapters');
      expect(tables).toContain('pages');
      expect(tables).toContain('admin_users');
    });
  });
});
