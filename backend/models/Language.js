const sqlite = require('../config/sqlite');

class Language {
  static async create({ name, code }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO languages (name, code) VALUES (?, ?)',
      [name, code]
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT * FROM languages WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM languages WHERE id = ?', [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE languages SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE languages SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async delete(id) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM languages WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM languages WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
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

module.exports = Language;
