const sqlite = require('../config/sqlite');

class Komik {
  static async create({ title, synopsis, language_id, cover_image, status, is_active, type }) {
    const db = await sqlite.getDb();
    db.run(
      'INSERT INTO komiks (title, synopsis, language_id, cover_image, status, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, synopsis, language_id, cover_image, status || 'ongoing', is_active !== undefined ? (is_active ? 1 : 0) : 1, type || 'manga']
    );
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND k.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND k.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.status) {
      query += ' AND k.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (k.title LIKE ? OR k.synopsis LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY k.id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE k.id = ?
    `, [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async findByTitle(title) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE k.title = ?
    `, [title]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && !key.includes('language')) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE komiks SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE komiks SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM komiks k WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND k.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND k.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.status) {
      query += ' AND k.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (k.title LIKE ? OR k.synopsis LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const result = db.exec(query, params);
    return result[0]?.values[0]?.[0] || 0;
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

module.exports = Komik;
