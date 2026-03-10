const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/admin.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;
let dbInitialized = false;

function ensureSchema(db) {
  // Create tables (idempotent — safe to run on every init)
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

  // Genre table
  db.run(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Komik-Genre junction table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS komik_genres (
      komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (komik_id, genre_id)
    );
  `);

  // Add type column to komiks (migration-safe)
  try {
    db.run(`ALTER TABLE komiks ADD COLUMN type TEXT DEFAULT 'manga'`);
  } catch (e) {
    // Column already exists — ignore
  }

  // Create indexes (idempotent)
  db.run('CREATE INDEX IF NOT EXISTS idx_websites_language ON websites(language_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komiks_language ON komiks(language_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_komik ON komik_websites(komik_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_website ON komik_websites(website_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_chapters_komik_website ON chapters(komik_website_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);');
  db.run('CREATE INDEX IF NOT EXISTS idx_pages_chapter ON pages(chapter_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_genres_komik ON komik_genres(komik_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_genres_genre ON komik_genres(genre_id);');
}

async function initDatabase() {
  if (dbInitialized) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  ensureSchema(db);
  saveDatabase();

  dbInitialized = true;
  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Export sync wrapper that initializes on first use
module.exports = {
  getDb: async () => await initDatabase(),
  save: saveDatabase,
  init: initDatabase
};
