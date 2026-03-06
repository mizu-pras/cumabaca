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
    if (pages.length === 0) return;

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
    const count = result[0].values[0][0];
    return count > 0;
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

module.exports = Page;
