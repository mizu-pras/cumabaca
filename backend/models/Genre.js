const sqlite = require('../config/sqlite');

class Genre {
  static async findOrCreate(name) {
    const db = await sqlite.getDb();
    const existing = db.exec('SELECT * FROM genres WHERE name = ?', [name]);
    const rows = this._parseResult(existing);
    if (rows.length > 0) return rows[0];

    db.run('INSERT INTO genres (name) VALUES (?)', [name]);
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId, name };
  }

  static async findAll() {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM genres ORDER BY name ASC');
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM genres WHERE id = ?', [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async findByKomikId(komikId) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT g.* FROM genres g
      INNER JOIN komik_genres kg ON g.id = kg.genre_id
      WHERE kg.komik_id = ?
      ORDER BY g.name ASC
    `, [komikId]);
    return this._parseResult(result);
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }
}

module.exports = Genre;
