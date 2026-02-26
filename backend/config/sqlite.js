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

async function initDatabase() {
  if (dbInitialized) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    // Create tables
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

    // NEW: Languages table
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

    // NEW: Websites table
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

    // NEW: Komiks table
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

    // NEW: Komik-Websites mapping table
    db.run(`
      CREATE TABLE IF NOT EXISTS komik_websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
        website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        total_chapters INTEGER DEFAULT 0,
        last_checked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(komik_id, website_id)
      );
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_websites_language ON websites(language_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komiks_language ON komiks(language_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_komik ON komik_websites(komik_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_website ON komik_websites(website_id);');

    saveDatabase();
  }

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
