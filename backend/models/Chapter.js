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
    let query = 'SELECT * FROM chapters WHERE komik_website_id = ? ORDER BY chapter_number DESC';
    const params = [komikWebsiteId];

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
    const rows = Chapter._parseResult(result);
    return rows[0] || null;
  }

  static async upsertBatch(komikWebsiteId, chapters) {
    const db = await sqlite.getDb();
    for (const chapter of chapters) {
      db.run(
        'INSERT OR REPLACE INTO chapters (komik_website_id, chapter_number, url) VALUES (?, ?, ?)',
        [komikWebsiteId, chapter.chapter_number, chapter.url]
      );
    }
    sqlite.save();
  }

  static async getLatestChapterNumber(komikWebsiteId) {
    const db = await sqlite.getDb();
    const result = db.exec(
      'SELECT MAX(chapter_number) FROM chapters WHERE komik_website_id = ?',
      [komikWebsiteId]
    );
    const value = result[0].values[0][0];
    return value !== null ? value : 0;
  }

  static async deleteByKomikWebsiteId(komikWebsiteId) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM chapters WHERE komik_website_id = ?', [komikWebsiteId]);
    sqlite.save();
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    const values = result[0].values;
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Chapter;
