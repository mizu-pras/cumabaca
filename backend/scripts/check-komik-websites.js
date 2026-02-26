#!/usr/bin/env node

/**
 * Debug script - Check komik_websites table content
 */

const sqlite = require('../config/sqlite');

async function check() {
  console.log('Checking komik_websites table...\n');

  try {
    const db = await sqlite.getDb();

    // Check if table exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='komik_websites'");
    if (!tables[0] || tables[0].values.length === 0) {
      console.log('❌ komik_websites table does NOT exist!');
      process.exit(1);
    }
    console.log('✓ komik_websites table exists\n');

    // Get table schema
    const schema = db.exec('PRAGMA table_info(komik_websites)');
    console.log('Table schema:');
    schema[0].values.forEach(row => {
      console.log(`  - ${row[1]} (${row[2]})`);
    });
    console.log('');

    // Get all data
    const data = db.exec('SELECT * FROM komik_websites');
    if (!data[0] || data[0].values.length === 0) {
      console.log('❌ No data in komik_websites table!');
      console.log('The table is empty.');
    } else {
      console.log(`✓ Found ${data[0].values.length} rows:\n`);
      const columns = data[0].columns;
      data[0].values.forEach((row, i) => {
        console.log(`Row ${i + 1}:`);
        columns.forEach((col, j) => {
          console.log(`  ${col}: ${row[j]}`);
        });
        console.log('');
      });
    }

    // Check specific ID
    const id2 = db.exec('SELECT * FROM komik_websites WHERE id = 2');
    if (!id2[0] || id2[0].values.length === 0) {
      console.log('❌ No row with id=2 found!');
    } else {
      console.log('✓ Row with id=2 exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

check();
