# Chapter & Page Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent chapter/page storage in SQLite, chapter scraping orchestration, and a public aggregated comic API with best-source logic.

**Architecture:** Backend orchestrates scraping by calling the existing scraper service, then stores results in SQLite. Chapters are scraped on admin trigger or external cron. Pages are scraped lazily on first user access. A new public API (`/api/komik`) serves aggregated comics with pagination, filters, and best-source selection.

**Tech Stack:** Express.js, sql.js (SQLite), axios (scraper client), Jest + supertest (tests)

---

### Task 1: Schema Migration — Add chapters and pages tables

**Files:**
- Modify: `backend/config/sqlite.js`

**Context:** Currently, CREATE TABLE statements only run when creating a new database. We need to make schema creation idempotent so it runs on every init (existing + new databases).

**Step 1: Write the failing test**

Create `backend/__tests__/unit/config/sqlite-migration.test.js`:

```javascript
const fs = require('fs');
const path = require('path');

// We need to test that the schema includes chapters and pages tables
// by checking the SQL statements in sqlite.js

describe('SQLite Schema', () => {
  it('should create chapters table with correct schema', async () => {
    // Set up temp db path
    const tmpPath = path.join(__dirname, '../../../data/test-migration.db');
    process.env.SQLITE_PATH = tmpPath;

    // Clear module cache to re-init
    delete require.cache[require.resolve('../../../config/sqlite')];
    const sqlite = require('../../../config/sqlite');
    const db = await sqlite.getDb();

    // Check chapters table exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='chapters'");
    expect(tables.length).toBe(1);
    expect(tables[0].values[0][0]).toBe('chapters');

    // Check columns
    const info = db.exec("PRAGMA table_info(chapters)");
    const columns = info[0].values.map(row => row[1]);
    expect(columns).toContain('id');
    expect(columns).toContain('komik_website_id');
    expect(columns).toContain('chapter_number');
    expect(columns).toContain('url');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');

    // Cleanup
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('should create pages table with correct schema', async () => {
    const tmpPath = path.join(__dirname, '../../../data/test-migration2.db');
    process.env.SQLITE_PATH = tmpPath;

    delete require.cache[require.resolve('../../../config/sqlite')];
    const sqlite = require('../../../config/sqlite');
    const db = await sqlite.getDb();

    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pages'");
    expect(tables.length).toBe(1);
    expect(tables[0].values[0][0]).toBe('pages');

    const info = db.exec("PRAGMA table_info(pages)");
    const columns = info[0].values.map(row => row[1]);
    expect(columns).toContain('id');
    expect(columns).toContain('chapter_id');
    expect(columns).toContain('page_number');
    expect(columns).toContain('image_url');

    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/config/sqlite-migration.test.js --no-cache`
Expected: FAIL — "chapters" table not found

**Step 3: Modify sqlite.js**

Refactor `backend/config/sqlite.js` to extract schema creation into a separate function that runs on EVERY init (not just new databases). Add chapters and pages tables:

```javascript
// Add this function (called from both branches of initDatabase)
function ensureSchema(db) {
  // Existing tables (CREATE IF NOT EXISTS is idempotent)
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS websites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      language_id INTEGER REFERENCES languages(id),
      use_browser BOOLEAN DEFAULT 0,
      search_endpoint TEXT,
      is_nsfw BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS komiks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      synopsis TEXT,
      language_id INTEGER REFERENCES languages(id),
      cover_image TEXT,
      status TEXT DEFAULT 'ongoing',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS komik_websites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
      website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      cover TEXT,
      synopsis TEXT,
      total_chapters INTEGER DEFAULT 0,
      last_checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(komik_id, website_id)
    );
  `);

  // NEW: Chapters table
  db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      komik_website_id INTEGER NOT NULL REFERENCES komik_websites(id) ON DELETE CASCADE,
      chapter_number REAL NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(komik_website_id, chapter_number)
    );
  `);

  // NEW: Pages table
  db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chapter_id, page_number)
    );
  `);

  // Indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_websites_language ON websites(language_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komiks_language ON komiks(language_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_komik ON komik_websites(komik_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_website ON komik_websites(website_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_chapters_komik_website ON chapters(komik_website_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);');
  db.run('CREATE INDEX IF NOT EXISTS idx_pages_chapter ON pages(chapter_id);');
}
```

Then update `initDatabase()`:

```javascript
async function initDatabase() {
  if (dbInitialized) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Always ensure schema (idempotent)
  ensureSchema(db);
  saveDatabase();

  dbInitialized = true;
  return db;
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/config/sqlite-migration.test.js --no-cache`
Expected: PASS

**Step 5: Run existing tests to verify no regressions**

Run: `cd backend && npx jest --no-cache`
Expected: All existing tests PASS

**Step 6: Commit**

```bash
git add backend/config/sqlite.js backend/__tests__/unit/config/sqlite-migration.test.js
git commit -m "feat: add chapters and pages tables to SQLite schema

Refactor schema creation to be idempotent (runs on every init),
enabling migration for existing databases. Adds chapters table
(komik_website_id, chapter_number, url) and pages table
(chapter_id, page_number, image_url)."
```

---

### Task 2: Chapter Model

**Files:**
- Create: `backend/models/Chapter.js`
- Test: `backend/__tests__/unit/models/Chapter.test.js`

**Step 1: Write the failing test**

Create `backend/__tests__/unit/models/Chapter.test.js`:

```javascript
jest.mock('../../config/sqlite', () => {
  const mockDb = {
    run: jest.fn(),
    exec: jest.fn(),
  };
  return {
    getDb: jest.fn().mockResolvedValue(mockDb),
    save: jest.fn(),
    _mockDb: mockDb,
  };
});

const Chapter = require('../../models/Chapter');
const sqlite = require('../../config/sqlite');

describe('Chapter Model', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = sqlite._mockDb;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert a chapter and return id', async () => {
      mockDb.exec.mockReturnValue([{ values: [[42]] }]);

      const result = await Chapter.create({
        komik_website_id: 1,
        chapter_number: 10.5,
        url: 'https://example.com/ch-10-5',
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [1, 10.5, 'https://example.com/ch-10-5']
      );
      expect(result).toEqual({ id: 42 });
    });
  });

  describe('findByKomikWebsiteId', () => {
    it('should return chapters ordered by chapter_number DESC', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'komik_website_id', 'chapter_number', 'url', 'created_at', 'updated_at'],
        values: [
          [2, 1, 10, 'https://example.com/ch-10', '2026-01-01', '2026-01-01'],
          [1, 1, 9, 'https://example.com/ch-9', '2026-01-01', '2026-01-01'],
        ],
      }]);

      const chapters = await Chapter.findByKomikWebsiteId(1);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].chapter_number).toBe(10);
      expect(chapters[1].chapter_number).toBe(9);
    });
  });

  describe('findById', () => {
    it('should return a single chapter', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'komik_website_id', 'chapter_number', 'url', 'created_at', 'updated_at'],
        values: [[1, 1, 5, 'https://example.com/ch-5', '2026-01-01', '2026-01-01']],
      }]);

      const chapter = await Chapter.findById(1);
      expect(chapter.id).toBe(1);
      expect(chapter.chapter_number).toBe(5);
    });

    it('should return null if not found', async () => {
      mockDb.exec.mockReturnValue([]);
      const chapter = await Chapter.findById(999);
      expect(chapter).toBeNull();
    });
  });

  describe('upsertBatch', () => {
    it('should insert or replace multiple chapters', async () => {
      mockDb.exec.mockReturnValue([{ values: [[2]] }]);

      const chapters = [
        { chapter_number: 1, url: 'https://example.com/ch-1' },
        { chapter_number: 2, url: 'https://example.com/ch-2' },
      ];

      await Chapter.upsertBatch(1, chapters);

      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLatestChapterNumber', () => {
    it('should return the max chapter number', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['max_chapter'],
        values: [[120]],
      }]);

      const latest = await Chapter.getLatestChapterNumber(1);
      expect(latest).toBe(120);
    });

    it('should return 0 if no chapters', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['max_chapter'],
        values: [[null]],
      }]);

      const latest = await Chapter.getLatestChapterNumber(1);
      expect(latest).toBe(0);
    });
  });

  describe('deleteByKomikWebsiteId', () => {
    it('should delete all chapters for a komik_website', async () => {
      await Chapter.deleteByKomikWebsiteId(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [1]
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/models/Chapter.test.js --no-cache`
Expected: FAIL — Cannot find module '../../models/Chapter'

**Step 3: Write the Chapter model**

Create `backend/models/Chapter.js`:

```javascript
const sqlite = require('../config/sqlite');

class Chapter {
  static async create({ komik_website_id, chapter_number, url }) {
    const db = await sqlite.getDb();
    db.run(
      'INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (?, ?, ?)',
      [komik_website_id, chapter_number, url]
    );
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId };
  }

  static async findByKomikWebsiteId(komikWebsiteId, filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT * FROM chapters WHERE komik_website_id = ?';
    const params = [komikWebsiteId];

    query += ' ORDER BY chapter_number DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM chapters WHERE id = ?', [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async upsertBatch(komikWebsiteId, chapters) {
    const db = await sqlite.getDb();
    for (const ch of chapters) {
      db.run(
        `INSERT OR REPLACE INTO chapters (komik_website_id, chapter_number, url, updated_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [komikWebsiteId, ch.chapter_number, ch.url]
      );
    }
    sqlite.save();
  }

  static async getLatestChapterNumber(komikWebsiteId) {
    const db = await sqlite.getDb();
    const result = db.exec(
      'SELECT MAX(chapter_number) as max_chapter FROM chapters WHERE komik_website_id = ?',
      [komikWebsiteId]
    );
    if (!result.length || result[0].values[0][0] === null) return 0;
    return result[0].values[0][0];
  }

  static async deleteByKomikWebsiteId(komikWebsiteId) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM chapters WHERE komik_website_id = ?', [komikWebsiteId]);
    sqlite.save();
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Chapter;
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/models/Chapter.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/models/Chapter.js backend/__tests__/unit/models/Chapter.test.js
git commit -m "feat: add Chapter model with CRUD and batch upsert"
```

---

### Task 3: Page Model

**Files:**
- Create: `backend/models/Page.js`
- Test: `backend/__tests__/unit/models/Page.test.js`

**Step 1: Write the failing test**

Create `backend/__tests__/unit/models/Page.test.js`:

```javascript
jest.mock('../../config/sqlite', () => {
  const mockDb = {
    run: jest.fn(),
    exec: jest.fn(),
  };
  return {
    getDb: jest.fn().mockResolvedValue(mockDb),
    save: jest.fn(),
    _mockDb: mockDb,
  };
});

const Page = require('../../models/Page');
const sqlite = require('../../config/sqlite');

describe('Page Model', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = sqlite._mockDb;
    jest.clearAllMocks();
  });

  describe('findByChapterId', () => {
    it('should return pages ordered by page_number ASC', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'chapter_id', 'page_number', 'image_url', 'created_at', 'updated_at'],
        values: [
          [1, 1, 1, 'https://img.example.com/1.jpg', '2026-01-01', '2026-01-01'],
          [2, 1, 2, 'https://img.example.com/2.jpg', '2026-01-01', '2026-01-01'],
        ],
      }]);

      const pages = await Page.findByChapterId(1);
      expect(pages).toHaveLength(2);
      expect(pages[0].page_number).toBe(1);
      expect(pages[1].page_number).toBe(2);
    });

    it('should return empty array if no pages', async () => {
      mockDb.exec.mockReturnValue([]);
      const pages = await Page.findByChapterId(999);
      expect(pages).toEqual([]);
    });
  });

  describe('insertBatch', () => {
    it('should insert multiple pages', async () => {
      const pages = [
        { page_number: 1, image_url: 'https://img.example.com/1.jpg' },
        { page_number: 2, image_url: 'https://img.example.com/2.jpg' },
        { page_number: 3, image_url: 'https://img.example.com/3.jpg' },
      ];

      await Page.insertBatch(1, pages);
      expect(mockDb.run).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleteByChapterId', () => {
    it('should delete all pages for a chapter', async () => {
      await Page.deleteByChapterId(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [1]
      );
    });
  });

  describe('hasPages', () => {
    it('should return true when pages exist', async () => {
      mockDb.exec.mockReturnValue([{ columns: ['count'], values: [[5]] }]);
      const result = await Page.hasPages(1);
      expect(result).toBe(true);
    });

    it('should return false when no pages', async () => {
      mockDb.exec.mockReturnValue([{ columns: ['count'], values: [[0]] }]);
      const result = await Page.hasPages(1);
      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/models/Page.test.js --no-cache`
Expected: FAIL — Cannot find module '../../models/Page'

**Step 3: Write the Page model**

Create `backend/models/Page.js`:

```javascript
const sqlite = require('../config/sqlite');

class Page {
  static async findByChapterId(chapterId) {
    const db = await sqlite.getDb();
    const result = db.exec(
      'SELECT * FROM pages WHERE chapter_id = ? ORDER BY page_number ASC',
      [chapterId]
    );
    return this._parseResult(result);
  }

  static async insertBatch(chapterId, pages) {
    const db = await sqlite.getDb();
    for (const page of pages) {
      db.run(
        'INSERT OR REPLACE INTO pages (chapter_id, page_number, image_url) VALUES (?, ?, ?)',
        [chapterId, page.page_number, page.image_url]
      );
    }
    sqlite.save();
  }

  static async deleteByChapterId(chapterId) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM pages WHERE chapter_id = ?', [chapterId]);
    sqlite.save();
  }

  static async hasPages(chapterId) {
    const db = await sqlite.getDb();
    const result = db.exec(
      'SELECT COUNT(*) as count FROM pages WHERE chapter_id = ?',
      [chapterId]
    );
    return (result[0]?.values[0]?.[0] || 0) > 0;
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Page;
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/models/Page.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/models/Page.js backend/__tests__/unit/models/Page.test.js
git commit -m "feat: add Page model with batch insert and lazy-load support"
```

---

### Task 4: Chapter Number Parser Utility

**Files:**
- Create: `backend/utils/chapterParser.js`
- Test: `backend/__tests__/unit/utils/chapterParser.test.js`

**Context:** Scrapers return chapter names as strings like "Ch 1", "Chapter 10.5", "Bab 3". We need to extract the numeric portion as a float.

**Step 1: Write the failing test**

Create `backend/__tests__/unit/utils/chapterParser.test.js`:

```javascript
const { parseChapterNumber } = require('../../utils/chapterParser');

describe('parseChapterNumber', () => {
  it('should parse "Ch 1" to 1', () => {
    expect(parseChapterNumber('Ch 1')).toBe(1);
  });

  it('should parse "Chapter 10.5" to 10.5', () => {
    expect(parseChapterNumber('Chapter 10.5')).toBe(10.5);
  });

  it('should parse "Bab 3" to 3', () => {
    expect(parseChapterNumber('Bab 3')).toBe(3);
  });

  it('should parse plain number "42" to 42', () => {
    expect(parseChapterNumber('42')).toBe(42);
  });

  it('should parse "Chapter 100" to 100', () => {
    expect(parseChapterNumber('Chapter 100')).toBe(100);
  });

  it('should parse "Ch. 5" to 5', () => {
    expect(parseChapterNumber('Ch. 5')).toBe(5);
  });

  it('should return null for unparseable strings', () => {
    expect(parseChapterNumber('Prologue')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseChapterNumber('')).toBeNull();
  });

  it('should handle "Chapter 0" as 0', () => {
    expect(parseChapterNumber('Chapter 0')).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/utils/chapterParser.test.js --no-cache`
Expected: FAIL — Cannot find module

**Step 3: Write the parser**

Create `backend/utils/chapterParser.js`:

```javascript
function parseChapterNumber(chapterString) {
  if (!chapterString || typeof chapterString !== 'string') return null;

  // Try to find a number (integer or decimal) in the string
  const match = chapterString.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  return parseFloat(match[1]);
}

module.exports = { parseChapterNumber };
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/utils/chapterParser.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/utils/chapterParser.js backend/__tests__/unit/utils/chapterParser.test.js
git commit -m "feat: add chapter number parser utility"
```

---

### Task 5: Chapter Scrape Controller

**Files:**
- Create: `backend/controllers/chapterScrapeController.js`
- Test: `backend/__tests__/unit/controllers/chapterScrapeController.test.js`

**Context:** This controller orchestrates chapter scraping: calls scraper service, parses chapter numbers, upserts into DB, and updates `komik_websites.total_chapters`.

**Step 1: Write the failing test**

Create `backend/__tests__/unit/controllers/chapterScrapeController.test.js`:

```javascript
jest.mock('../../middleware/scraperClient');
jest.mock('../../models/Chapter');
jest.mock('../../models/KomikWebsite');

const scraperClient = require('../../middleware/scraperClient');
const Chapter = require('../../models/Chapter');
const KomikWebsite = require('../../models/KomikWebsite');
const chapterScrapeController = require('../../controllers/chapterScrapeController');

describe('chapterScrapeController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('scrapeChapters', () => {
    it('should scrape chapters for a komik_website and store them', async () => {
      req.params.id = '1';

      KomikWebsite.findById.mockResolvedValue({
        id: 1, komik_id: 1, website_id: 1, url: 'https://komiku.org/one-piece/',
      });

      scraperClient.getChapters.mockResolvedValue({
        data: [
          { chapter: 'Ch 10', url: 'https://komiku.org/ch-10/' },
          { chapter: 'Ch 9', url: 'https://komiku.org/ch-9/' },
        ],
      });

      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(scraperClient.getChapters).toHaveBeenCalledWith('https://komiku.org/one-piece/', 'normal');
      expect(Chapter.upsertBatch).toHaveBeenCalledWith(1, [
        { chapter_number: 10, url: 'https://komiku.org/ch-10/' },
        { chapter_number: 9, url: 'https://komiku.org/ch-9/' },
      ]);
      expect(KomikWebsite.update).toHaveBeenCalledWith(1, expect.objectContaining({
        total_chapters: 2,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ chapters_found: 2 }),
      }));
    });

    it('should return 404 if komik_website not found', async () => {
      req.params.id = '999';
      KomikWebsite.findById.mockResolvedValue(null);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should skip chapters with unparseable numbers', async () => {
      req.params.id = '1';

      KomikWebsite.findById.mockResolvedValue({
        id: 1, url: 'https://komiku.org/manga/',
      });

      scraperClient.getChapters.mockResolvedValue({
        data: [
          { chapter: 'Ch 5', url: 'https://komiku.org/ch-5/' },
          { chapter: 'Prologue', url: 'https://komiku.org/prologue/' },
        ],
      });

      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(Chapter.upsertBatch).toHaveBeenCalledWith(1, [
        { chapter_number: 5, url: 'https://komiku.org/ch-5/' },
      ]);
    });
  });

  describe('syncAll', () => {
    it('should scrape chapters for all active komik_websites', async () => {
      KomikWebsite.findAll.mockResolvedValue([
        { id: 1, url: 'https://komiku.org/manga-1/' },
        { id: 2, url: 'https://komiku.org/manga-2/' },
      ]);

      scraperClient.getChapters
        .mockResolvedValueOnce({ data: [{ chapter: 'Ch 1', url: 'https://komiku.org/ch-1/' }] })
        .mockResolvedValueOnce({ data: [{ chapter: 'Ch 2', url: 'https://komiku.org/ch-2/' }] });

      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.syncAll(req, res);

      expect(scraperClient.getChapters).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ total: 2, success: 2 }),
      }));
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/controllers/chapterScrapeController.test.js --no-cache`
Expected: FAIL — Cannot find module

**Step 3: Write the controller**

Create `backend/controllers/chapterScrapeController.js`:

```javascript
const scraperClient = require('../middleware/scraperClient');
const Chapter = require('../models/Chapter');
const KomikWebsite = require('../models/KomikWebsite');
const { parseChapterNumber } = require('../utils/chapterParser');

const chapterScrapeController = {
  async scrapeChapters(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'KomikWebsite not found' });
      }

      const result = await scraperClient.getChapters(komikWebsite.url, 'normal');
      const rawChapters = result.data || [];

      // Parse chapter numbers, skip unparseable
      const chapters = rawChapters
        .map(ch => ({
          chapter_number: parseChapterNumber(ch.chapter),
          url: ch.url,
        }))
        .filter(ch => ch.chapter_number !== null);

      await Chapter.upsertBatch(parseInt(id), chapters);
      await KomikWebsite.update(parseInt(id), {
        total_chapters: chapters.length,
        last_checked_at: new Date().toISOString(),
      });

      res.json({
        data: {
          komik_website_id: parseInt(id),
          chapters_found: chapters.length,
          skipped: rawChapters.length - chapters.length,
        },
      });
    } catch (error) {
      console.error('Scrape chapters error:', error);
      res.status(500).json({ error: 'Failed to scrape chapters' });
    }
  },

  async syncAll(req, res) {
    try {
      const komikWebsites = await KomikWebsite.findAll();
      const results = { total: komikWebsites.length, success: 0, failed: 0, errors: [] };

      for (const kw of komikWebsites) {
        try {
          const result = await scraperClient.getChapters(kw.url, 'normal');
          const rawChapters = result.data || [];

          const chapters = rawChapters
            .map(ch => ({
              chapter_number: parseChapterNumber(ch.chapter),
              url: ch.url,
            }))
            .filter(ch => ch.chapter_number !== null);

          await Chapter.upsertBatch(kw.id, chapters);
          await KomikWebsite.update(kw.id, {
            total_chapters: chapters.length,
            last_checked_at: new Date().toISOString(),
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ id: kw.id, url: kw.url, error: error.message });
        }
      }

      res.json({ data: results });
    } catch (error) {
      console.error('Sync all error:', error);
      res.status(500).json({ error: 'Failed to sync chapters' });
    }
  },

  async getChapters(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'KomikWebsite not found' });
      }

      const chapters = await Chapter.findByKomikWebsiteId(parseInt(id));
      res.json({ data: chapters });
    } catch (error) {
      console.error('Get chapters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = chapterScrapeController;
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/controllers/chapterScrapeController.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/controllers/chapterScrapeController.js backend/__tests__/unit/controllers/chapterScrapeController.test.js
git commit -m "feat: add chapter scrape controller with single and sync-all support"
```

---

### Task 6: Admin Scraping Routes

**Files:**
- Modify: `backend/routes/admin/komik-websites.js`
- Create: `backend/routes/admin/scrape.js`
- Modify: `backend/routes/admin.js`

**Step 1: Write the failing test**

Create `backend/__tests__/unit/routes/adminScrape.test.js`:

```javascript
jest.mock('../../controllers/chapterScrapeController', () => ({
  scrapeChapters: jest.fn((req, res) => res.json({ data: { chapters_found: 5 } })),
  syncAll: jest.fn((req, res) => res.json({ data: { total: 2, success: 2 } })),
  getChapters: jest.fn((req, res) => res.json({ data: [] })),
}));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => next(),
}));

const request = require('supertest');
const express = require('express');

describe('Admin scrape routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/admin/komik-websites', require('../../routes/admin/komik-websites'));
    app.use('/admin/scrape', require('../../routes/admin/scrape'));
  });

  it('POST /admin/komik-websites/:id/scrape-chapters should call scrapeChapters', async () => {
    const res = await request(app).post('/admin/komik-websites/1/scrape-chapters');
    expect(res.status).toBe(200);
    expect(res.body.data.chapters_found).toBe(5);
  });

  it('GET /admin/komik-websites/:id/chapters should call getChapters', async () => {
    const res = await request(app).get('/admin/komik-websites/1/chapters');
    expect(res.status).toBe(200);
  });

  it('POST /admin/scrape/sync should call syncAll', async () => {
    const res = await request(app).post('/admin/scrape/sync');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/routes/adminScrape.test.js --no-cache`
Expected: FAIL — routes don't have these endpoints yet

**Step 3: Add the routes**

Modify `backend/routes/admin/komik-websites.js` — add two new routes:

```javascript
const express = require('express');
const router = express.Router();
const komikWebsiteController = require('../../controllers/komikWebsiteController');
const chapterScrapeController = require('../../controllers/chapterScrapeController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikWebsiteController.getAll);
router.get('/:id', komikWebsiteController.getById);
router.post('/', komikWebsiteController.create);
router.put('/:id', komikWebsiteController.update);
router.delete('/:id', komikWebsiteController.delete);

// Chapter scraping
router.post('/:id/scrape-chapters', chapterScrapeController.scrapeChapters);
router.get('/:id/chapters', chapterScrapeController.getChapters);

module.exports = router;
```

Create `backend/routes/admin/scrape.js`:

```javascript
const express = require('express');
const router = express.Router();
const chapterScrapeController = require('../../controllers/chapterScrapeController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.post('/sync', chapterScrapeController.syncAll);

module.exports = router;
```

Modify `backend/routes/admin.js` — add scrape route:

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/me', adminController.getMe);

router.use('/languages', require('./admin/languages'));
router.use('/websites', require('./admin/websites'));
router.use('/komiks', require('./admin/komiks'));
router.use('/komik-websites', require('./admin/komik-websites'));
router.use('/scrape', require('./admin/scrape'));

module.exports = router;
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/routes/adminScrape.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/routes/admin/komik-websites.js backend/routes/admin/scrape.js backend/routes/admin.js backend/__tests__/unit/routes/adminScrape.test.js
git commit -m "feat: add admin routes for chapter scraping and sync"
```

---

### Task 7: Public Komik API Controller

**Files:**
- Create: `backend/controllers/publicKomikController.js`
- Test: `backend/__tests__/unit/controllers/publicKomikController.test.js`

**Context:** This is the main `GET /api/komik` endpoint. It queries komiks with pagination/filters and joins with komik_websites + chapters to find the best source (MAX chapter_number).

**Step 1: Write the failing test**

Create `backend/__tests__/unit/controllers/publicKomikController.test.js`:

```javascript
jest.mock('../../config/sqlite', () => {
  const mockDb = {
    run: jest.fn(),
    exec: jest.fn(),
  };
  return {
    getDb: jest.fn().mockResolvedValue(mockDb),
    save: jest.fn(),
    _mockDb: mockDb,
  };
});
jest.mock('../../models/Chapter');
jest.mock('../../models/Page');
jest.mock('../../middleware/scraperClient');

const publicKomikController = require('../../controllers/publicKomikController');
const sqlite = require('../../config/sqlite');
const Chapter = require('../../models/Chapter');
const Page = require('../../models/Page');
const scraperClient = require('../../middleware/scraperClient');

describe('publicKomikController', () => {
  let req, res, mockDb;

  beforeEach(() => {
    mockDb = sqlite._mockDb;
    jest.clearAllMocks();
    req = { params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('listKomiks', () => {
    it('should return paginated komiks with best source', async () => {
      // Count query
      mockDb.exec.mockReturnValueOnce([{ columns: ['count'], values: [[2]] }]);

      // Main query
      mockDb.exec.mockReturnValueOnce([{
        columns: [
          'id', 'title', 'synopsis', 'cover_image', 'status',
          'language_id', 'language_name',
          'source_website_id', 'source_website_name', 'source_url',
          'source_cover', 'source_synopsis', 'latest_chapter',
        ],
        values: [
          [1, 'One Piece', 'Pirates!', 'https://cover.jpg', 'ongoing',
           1, 'Indonesian',
           3, 'komiku.org', 'https://komiku.org/one-piece/',
           null, null, 1120],
          [2, 'Naruto', null, null, 'completed',
           1, 'Indonesian',
           3, 'komiku.org', 'https://komiku.org/naruto/',
           'https://source-cover.jpg', 'Source synopsis', 700],
        ],
      }]);

      req.query = { page: '1', limit: '20' };

      await publicKomikController.listKomiks(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data).toHaveLength(2);
      expect(response.data[0].title).toBe('One Piece');
      expect(response.data[0].cover_image).toBe('https://cover.jpg');
      expect(response.data[0].source.latest_chapter).toBe(1120);

      // Naruto: no komik-level cover, should fallback to source
      expect(response.data[1].cover_image).toBe('https://source-cover.jpg');
      expect(response.data[1].synopsis).toBe('Source synopsis');

      expect(response.pagination.total).toBe(2);
    });
  });

  describe('getChapters', () => {
    it('should return chapters for the best source of a komik', async () => {
      // Best source query
      mockDb.exec.mockReturnValueOnce([{
        columns: ['id'],
        values: [[5]],
      }]);

      Chapter.findByKomikWebsiteId.mockResolvedValue([
        { id: 2, chapter_number: 10, url: 'https://komiku.org/ch-10/' },
        { id: 1, chapter_number: 9, url: 'https://komiku.org/ch-9/' },
      ]);

      req.params.id = '1';

      await publicKomikController.getChapters(req, res);

      expect(Chapter.findByKomikWebsiteId).toHaveBeenCalledWith(5, {});
      expect(res.json.mock.calls[0][0].data).toHaveLength(2);
    });

    it('should return 404 if komik has no sources', async () => {
      mockDb.exec.mockReturnValueOnce([]);
      req.params.id = '999';

      await publicKomikController.getChapters(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getPages', () => {
    it('should return cached pages if they exist', async () => {
      Page.hasPages.mockResolvedValue(true);
      Page.findByChapterId.mockResolvedValue([
        { id: 1, page_number: 1, image_url: 'https://img.com/1.jpg' },
        { id: 2, page_number: 2, image_url: 'https://img.com/2.jpg' },
      ]);

      req.params = { komikId: '1', chapterId: '1' };

      await publicKomikController.getPages(req, res);

      expect(scraperClient.getData).not.toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].data).toHaveLength(2);
    });

    it('should scrape and store pages on first access', async () => {
      Page.hasPages.mockResolvedValue(false);

      Chapter.findById.mockResolvedValue({
        id: 1, url: 'https://komiku.org/ch-1/',
      });

      scraperClient.getData.mockResolvedValue({
        data: {
          title: 'Chapter 1',
          data: ['https://img.com/1.jpg', 'https://img.com/2.jpg'],
        },
      });

      Page.insertBatch.mockResolvedValue();
      Page.findByChapterId.mockResolvedValue([
        { id: 1, page_number: 1, image_url: 'https://img.com/1.jpg' },
        { id: 2, page_number: 2, image_url: 'https://img.com/2.jpg' },
      ]);

      req.params = { komikId: '1', chapterId: '1' };

      await publicKomikController.getPages(req, res);

      expect(scraperClient.getData).toHaveBeenCalledWith('https://komiku.org/ch-1/', 'normal');
      expect(Page.insertBatch).toHaveBeenCalledWith(1, [
        { page_number: 1, image_url: 'https://img.com/1.jpg' },
        { page_number: 2, image_url: 'https://img.com/2.jpg' },
      ]);
    });

    it('should return 404 if chapter not found', async () => {
      Page.hasPages.mockResolvedValue(false);
      Chapter.findById.mockResolvedValue(null);

      req.params = { komikId: '1', chapterId: '999' };

      await publicKomikController.getPages(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/controllers/publicKomikController.test.js --no-cache`
Expected: FAIL — Cannot find module

**Step 3: Write the controller**

Create `backend/controllers/publicKomikController.js`:

```javascript
const sqlite = require('../config/sqlite');
const Chapter = require('../models/Chapter');
const Page = require('../models/Page');
const scraperClient = require('../middleware/scraperClient');

function _parseResult(result) {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

const publicKomikController = {
  async listKomiks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const { language, search, status } = req.query;

      const db = await sqlite.getDb();

      // Build WHERE clause
      let where = 'WHERE k.is_active = 1';
      const params = [];

      if (language) {
        where += ' AND k.language_id = ?';
        params.push(parseInt(language));
      }
      if (search) {
        where += ' AND (k.title LIKE ? OR k.synopsis LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (status) {
        where += ' AND k.status = ?';
        params.push(status);
      }

      // Count total
      const countResult = db.exec(
        `SELECT COUNT(*) as count FROM komiks k ${where}`,
        params
      );
      const total = countResult[0]?.values[0]?.[0] || 0;

      // Main query with best source (website with MAX chapter_number)
      const query = `
        SELECT
          k.id, k.title, k.synopsis, k.cover_image, k.status,
          k.language_id, l.name as language_name,
          best.website_id as source_website_id,
          w.name as source_website_name,
          best.url as source_url,
          best.cover as source_cover,
          best.synopsis as source_synopsis,
          best.latest_chapter
        FROM komiks k
        LEFT JOIN languages l ON k.language_id = l.id
        LEFT JOIN (
          SELECT
            kw.komik_id,
            kw.website_id,
            kw.url,
            kw.cover,
            kw.synopsis,
            MAX(c.chapter_number) as latest_chapter,
            ROW_NUMBER() OVER (
              PARTITION BY kw.komik_id
              ORDER BY MAX(c.chapter_number) DESC NULLS LAST
            ) as rn
          FROM komik_websites kw
          LEFT JOIN chapters c ON c.komik_website_id = kw.id
          GROUP BY kw.id
        ) best ON best.komik_id = k.id AND best.rn = 1
        LEFT JOIN websites w ON best.website_id = w.id
        ${where}
        ORDER BY k.id DESC
        LIMIT ? OFFSET ?
      `;

      const mainResult = db.exec(query, [...params, limit, offset]);
      const rows = _parseResult(mainResult);

      // Format response with fallback chain
      const data = rows.map(row => ({
        id: row.id,
        title: row.title,
        cover_image: row.cover_image || row.source_cover || null,
        synopsis: row.synopsis || row.source_synopsis || null,
        status: row.status,
        language: row.language_name,
        source: row.source_website_id ? {
          website_id: row.source_website_id,
          website_name: row.source_website_name,
          url: row.source_url,
          latest_chapter: row.latest_chapter || 0,
        } : null,
      }));

      res.json({
        data,
        pagination: { page, limit, total },
      });
    } catch (error) {
      console.error('List komiks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getChapters(req, res) {
    try {
      const komikId = parseInt(req.params.id);
      const db = await sqlite.getDb();

      // Find best source for this komik
      const bestSourceResult = db.exec(`
        SELECT kw.id
        FROM komik_websites kw
        LEFT JOIN chapters c ON c.komik_website_id = kw.id
        WHERE kw.komik_id = ?
        GROUP BY kw.id
        ORDER BY MAX(c.chapter_number) DESC NULLS LAST
        LIMIT 1
      `, [komikId]);

      const bestSources = _parseResult(bestSourceResult);
      if (bestSources.length === 0) {
        return res.status(404).json({ error: 'No sources found for this komik' });
      }

      const chapters = await Chapter.findByKomikWebsiteId(bestSources[0].id, {});
      res.json({ data: chapters });
    } catch (error) {
      console.error('Get chapters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getPages(req, res) {
    try {
      const chapterId = parseInt(req.params.chapterId);

      // Check if pages already stored
      const cached = await Page.hasPages(chapterId);
      if (cached) {
        const pages = await Page.findByChapterId(chapterId);
        return res.json({ data: pages });
      }

      // Lazy scrape: fetch from scraper service
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      const result = await scraperClient.getData(chapter.url, 'normal');
      const imageUrls = result.data?.data || [];

      // Store pages
      const pages = imageUrls.map((url, index) => ({
        page_number: index + 1,
        image_url: url,
      }));

      await Page.insertBatch(chapterId, pages);

      // Return from DB to ensure consistency
      const storedPages = await Page.findByChapterId(chapterId);
      res.json({ data: storedPages });
    } catch (error) {
      console.error('Get pages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = publicKomikController;
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/controllers/publicKomikController.test.js --no-cache`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/controllers/publicKomikController.js backend/__tests__/unit/controllers/publicKomikController.test.js
git commit -m "feat: add public komik API controller with best-source logic and lazy page loading"
```

---

### Task 8: Public API Routes

**Files:**
- Create: `backend/routes/api.js`
- Modify: `backend/app.js`
- Test: `backend/__tests__/unit/routes/publicApi.test.js`

**Step 1: Write the failing test**

Create `backend/__tests__/unit/routes/publicApi.test.js`:

```javascript
jest.mock('../../controllers/publicKomikController', () => ({
  listKomiks: jest.fn((req, res) => res.json({ data: [], pagination: {} })),
  getChapters: jest.fn((req, res) => res.json({ data: [] })),
  getPages: jest.fn((req, res) => res.json({ data: [] })),
}));

const request = require('supertest');
const express = require('express');

describe('Public API routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/komik', require('../../routes/api'));
  });

  it('GET /api/komik should call listKomiks', async () => {
    const res = await request(app).get('/api/komik');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/komik/:id/chapters should call getChapters', async () => {
    const res = await request(app).get('/api/komik/1/chapters');
    expect(res.status).toBe(200);
  });

  it('GET /api/komik/:komikId/chapters/:chapterId/pages should call getPages', async () => {
    const res = await request(app).get('/api/komik/1/chapters/1/pages');
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest __tests__/unit/routes/publicApi.test.js --no-cache`
Expected: FAIL — Cannot find module '../../routes/api'

**Step 3: Create the route file and mount it**

Create `backend/routes/api.js`:

```javascript
const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const publicKomikController = require('../controllers/publicKomikController');

router.get('/', asyncHandler(publicKomikController.listKomiks));
router.get('/:id/chapters', asyncHandler(publicKomikController.getChapters));
router.get('/:komikId/chapters/:chapterId/pages', asyncHandler(publicKomikController.getPages));

module.exports = router;
```

Modify `backend/app.js` — add new route mount after existing routes. Add this line after `app.use('/komik', komikRouter);`:

```javascript
const apiRouter = require('./routes/api');
// ... (existing code)
app.use('/api/komik', apiRouter);
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx jest __tests__/unit/routes/publicApi.test.js --no-cache`
Expected: PASS

**Step 5: Run all tests**

Run: `cd backend && npx jest --no-cache`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add backend/routes/api.js backend/app.js backend/__tests__/unit/routes/publicApi.test.js
git commit -m "feat: add public API routes for komik listing, chapters, and pages

Mounts GET /api/komik, GET /api/komik/:id/chapters,
GET /api/komik/:komikId/chapters/:chapterId/pages"
```

---

### Task 9: Add cover and synopsis columns to komik_websites

**Files:**
- Modify: `backend/models/KomikWebsite.js`

**Context:** The design calls for `cover` and `synopsis` fields on `komik_websites` for the fallback chain. The schema in Task 1 already adds these columns. The model needs to support them in create/update.

**Step 1: Verify columns exist in schema**

The `ensureSchema` function from Task 1 already includes `cover TEXT` and `synopsis TEXT` in the `komik_websites` CREATE TABLE. Verify by running:

Run: `cd backend && npx jest __tests__/unit/config/sqlite-migration.test.js --no-cache`
Expected: PASS

**Step 2: Update KomikWebsite.create to accept cover and synopsis**

Modify `backend/models/KomikWebsite.js` — update the `create` method:

```javascript
static async create({ komik_id, website_id, url, cover, synopsis, total_chapters }) {
  const db = await sqlite.getDb();
  db.run(
    'INSERT INTO komik_websites (komik_id, website_id, url, cover, synopsis, total_chapters) VALUES (?, ?, ?, ?, ?, ?)',
    [komik_id, website_id, url, cover || null, synopsis || null, total_chapters || 0]
  );
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  sqlite.save();
  return { id: lastId };
}
```

**Step 3: Run all tests to verify no regressions**

Run: `cd backend && npx jest --no-cache`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add backend/models/KomikWebsite.js
git commit -m "feat: add cover and synopsis support to KomikWebsite model"
```

---

### Task 10: Integration Test

**Files:**
- Create: `backend/__tests__/integration/publicApi.test.js`

**Context:** End-to-end test of the public API flow with a real SQLite database (in-memory).

**Step 1: Write the integration test**

Create `backend/__tests__/integration/publicApi.test.js`:

```javascript
const request = require('supertest');
const express = require('express');

// Use a temp DB for integration test
const path = require('path');
const tmpDbPath = path.join(__dirname, '../../data/test-integration-api.db');
process.env.SQLITE_PATH = tmpDbPath;

const fs = require('fs');
if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

// Reset sqlite module
delete require.cache[require.resolve('../../config/sqlite')];

const sqlite = require('../../config/sqlite');
const apiRouter = require('../../routes/api');

// Mock scraperClient for lazy page loading
jest.mock('../../middleware/scraperClient', () => ({
  getData: jest.fn().mockResolvedValue({
    data: {
      title: 'Ch 1',
      data: ['https://img.com/1.jpg', 'https://img.com/2.jpg'],
    },
  }),
}));

describe('Public API Integration', () => {
  let app;

  beforeAll(async () => {
    await sqlite.init();
    const db = await sqlite.getDb();

    // Seed test data
    db.run("INSERT INTO languages (name, code) VALUES ('Indonesian', 'id')");
    db.run("INSERT INTO websites (name, url, language_id) VALUES ('Komiku', 'https://komiku.org', 1)");
    db.run("INSERT INTO komiks (title, synopsis, language_id, cover_image, status) VALUES ('Test Manga', 'A test manga', 1, 'https://cover.jpg', 'ongoing')");
    db.run("INSERT INTO komik_websites (komik_id, website_id, url) VALUES (1, 1, 'https://komiku.org/test-manga/')");
    db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (1, 1, 'https://komiku.org/ch-1/')");
    db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (1, 2, 'https://komiku.org/ch-2/')");
    sqlite.save();

    app = express();
    app.use(express.json());
    app.use('/api/komik', apiRouter);
  });

  afterAll(() => {
    if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
  });

  it('GET /api/komik should return komiks with best source', async () => {
    const res = await request(app).get('/api/komik');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Test Manga');
    expect(res.body.data[0].source.latest_chapter).toBe(2);
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /api/komik?search=test should filter by search', async () => {
    const res = await request(app).get('/api/komik?search=test');
    expect(res.body.data).toHaveLength(1);

    const res2 = await request(app).get('/api/komik?search=nonexistent');
    expect(res2.body.data).toHaveLength(0);
  });

  it('GET /api/komik/1/chapters should return chapters', async () => {
    const res = await request(app).get('/api/komik/1/chapters');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].chapter_number).toBe(2); // DESC order
  });

  it('GET /api/komik/1/chapters/1/pages should lazy-load pages', async () => {
    const res = await request(app).get('/api/komik/1/chapters/1/pages');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].image_url).toBe('https://img.com/1.jpg');

    // Second request should use cached pages (scraperClient not called again)
    const scraperClient = require('../../middleware/scraperClient');
    scraperClient.getData.mockClear();
    const res2 = await request(app).get('/api/komik/1/chapters/1/pages');
    expect(res2.body.data).toHaveLength(2);
    expect(scraperClient.getData).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run integration test**

Run: `cd backend && npx jest __tests__/integration/publicApi.test.js --no-cache`
Expected: PASS

**Step 3: Run all tests**

Run: `cd backend && npx jest --no-cache`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add backend/__tests__/integration/publicApi.test.js
git commit -m "test: add integration tests for public komik API"
```

---

## Summary of Files

### Created
| File | Purpose |
|------|---------|
| `backend/models/Chapter.js` | Chapter CRUD model |
| `backend/models/Page.js` | Page model with lazy-load support |
| `backend/utils/chapterParser.js` | Extract numbers from chapter strings |
| `backend/controllers/chapterScrapeController.js` | Chapter scraping orchestration |
| `backend/controllers/publicKomikController.js` | Public API with best-source logic |
| `backend/routes/api.js` | Public API routes |
| `backend/routes/admin/scrape.js` | Admin sync endpoint |

### Modified
| File | Change |
|------|--------|
| `backend/config/sqlite.js` | Add chapters/pages tables, make schema idempotent |
| `backend/models/KomikWebsite.js` | Add cover/synopsis to create |
| `backend/routes/admin/komik-websites.js` | Add scrape-chapters and chapters routes |
| `backend/routes/admin.js` | Mount scrape routes |
| `backend/app.js` | Mount `/api/komik` route |

### Tests Created
| File | Covers |
|------|--------|
| `backend/__tests__/unit/config/sqlite-migration.test.js` | Schema migration |
| `backend/__tests__/unit/models/Chapter.test.js` | Chapter model |
| `backend/__tests__/unit/models/Page.test.js` | Page model |
| `backend/__tests__/unit/utils/chapterParser.test.js` | Chapter parser |
| `backend/__tests__/unit/controllers/chapterScrapeController.test.js` | Scrape controller |
| `backend/__tests__/unit/controllers/publicKomikController.test.js` | Public API controller |
| `backend/__tests__/unit/routes/adminScrape.test.js` | Admin scrape routes |
| `backend/__tests__/unit/routes/publicApi.test.js` | Public API routes |
| `backend/__tests__/integration/publicApi.test.js` | Full flow integration |
