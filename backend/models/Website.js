const sqlite = require('../config/sqlite');

class Website {
  static async create({ name, url, language_id, use_browser, search_endpoint, is_nsfw }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO websites (name, url, language_id, use_browser, search_endpoint, is_nsfw) VALUES (?, ?, ?, ?, ?, ?)',
      [name, url, language_id, use_browser ? 1 : 0, search_endpoint, is_nsfw ? 1 : 0]
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT w.*, l.name as language_name, l.code as language_code
      FROM websites w
      LEFT JOIN languages l ON w.language_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND w.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND w.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.url LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.id DESC';

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
      SELECT w.*, l.name as language_name, l.code as language_code
      FROM websites w
      LEFT JOIN languages l ON w.language_id = l.id
      WHERE w.id = ?
    `, [id]);
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
    db.run(`UPDATE websites SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE websites SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM websites w WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND w.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND w.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.url LIKE ?)';
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

module.exports = Website;
