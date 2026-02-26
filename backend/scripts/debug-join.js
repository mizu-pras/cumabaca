#!/usr/bin/env node

/**
 * Debug script - Test the findById query
 */

const sqlite = require('../config/sqlite');

async function debug() {
  console.log('Debugging findById query...\n');

  try {
    const db = await sqlite.getDb();

    // Check komiks table
    console.log('=== Komiks table ===');
    const komiks = db.exec('SELECT id, title FROM komiks');
    if (komiks[0]) {
      komiks[0].values.forEach(row => {
        console.log(`  ID ${row[0]}: ${row[1]}`);
      });
    }
    console.log('');

    // Check websites table
    console.log('=== Websites table ===');
    const websites = db.exec('SELECT id, name FROM websites');
    if (websites[0]) {
      websites[0].values.forEach(row => {
        console.log(`  ID ${row[0]}: ${row[1]}`);
      });
    }
    console.log('');

    // Check komik_websites table
    console.log('=== Komik_Websites table ===');
    const kw = db.exec('SELECT id, komik_id, website_id, url FROM komik_websites');
    if (kw[0]) {
      kw[0].values.forEach(row => {
        console.log(`  ID ${row[0]}: komik_id=${row[1]}, website_id=${row[2]}, url=${row[3]}`);
      });
    }
    console.log('');

    // Test the findById query
    console.log('=== Testing findById(2) query ===');
    const result = db.exec(`
      SELECT kw.*, k.title as komik_title, w.name as website_name, w.url as website_url
      FROM komik_websites kw
      LEFT JOIN komiks k ON kw.komik_id = k.id
      LEFT JOIN websites w ON kw.website_id = w.id
      WHERE kw.id = ?
    `, [2]);

    if (!result[0] || result[0].values.length === 0) {
      console.log('❌ No results from findById(2) query!');
    } else {
      console.log('✓ Found result:');
      const columns = result[0].columns;
      const row = result[0].values[0];
      columns.forEach((col, i) => {
        console.log(`  ${col}: ${row[i]}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debug();
