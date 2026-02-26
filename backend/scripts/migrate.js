#!/usr/bin/env node

/**
 * Migration script - Add missing columns to existing tables
 */

const sqlite = require('../config/sqlite');

async function migrate() {
  console.log('Running migrations...\n');

  try {
    const db = await sqlite.getDb();

    // Check if komiks table has is_active column
    const komiksColumns = db.exec('PRAGMA table_info(komiks)');
    const hasIsActive = komiksColumns[0]?.values.some(row => row[1] === 'is_active');

    if (!hasIsActive) {
      console.log('Adding is_active column to komiks table...');
      db.run('ALTER TABLE komiks ADD COLUMN is_active BOOLEAN DEFAULT 1');
      sqlite.save();
      console.log('✓ Added is_active column to komiks table\n');
    } else {
      console.log('✓ komiks table already has is_active column\n');
    }

    // Check if komik_websites table exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='komik_websites'");
    const hasKomikWebsitesTable = tables[0]?.values.length > 0;

    if (!hasKomikWebsitesTable) {
      console.log('Creating komik_websites table...');
      db.run(`
        CREATE TABLE komik_websites (
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
      db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_komik ON komik_websites(komik_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_website ON komik_websites(website_id);');

      sqlite.save();
      console.log('✓ Created komik_websites table\n');
    } else {
      console.log('✓ komik_websites table already exists\n');
    }

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
