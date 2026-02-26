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

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
