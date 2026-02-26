const sqlite = require('../config/sqlite');

class KomikWebsite {
  static async create({ komik_id, website_id, url, total_chapters }) {
    const db = await sqlite.getDb();
    db.run(
      'INSERT INTO komik_websites (komik_id, website_id, url, total_chapters) VALUES (?, ?, ?, ?)',
      [komik_id, website_id, url, total_chapters || 0]
    );
    // Get the last insert ID
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT kw.*, k.title as komik_title, w.name as website_name, w.url as website_url
      FROM komik_websites kw
      LEFT JOIN komiks k ON kw.komik_id = k.id
      LEFT JOIN websites w ON kw.website_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.komik_id) {
      query += ' AND kw.komik_id = ?';
      params.push(filters.komik_id);
    }

    if (filters.website_id) {
      query += ' AND kw.website_id = ?';
      params.push(filters.website_id);
    }

    query += ' ORDER BY kw.id DESC';

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
      SELECT kw.*, k.title as komik_title, w.name as website_name, w.url as website_url
      FROM komik_websites kw
      LEFT JOIN komiks k ON kw.komik_id = k.id
      LEFT JOIN websites w ON kw.website_id = w.id
      WHERE kw.id = ?
    `, [id]);

    console.log(`[DEBUG] KomikWebsite.findById(${id}):`, {
      hasResult: !!result[0],
      valuesLength: result[0]?.values?.length || 0,
      result: result[0]
    });

    const rows = KomikWebsite._parseResult(result);
    console.log(`[DEBUG] Parsed rows:`, rows.length, rows[0] || 'null');
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && !key.includes('komik') && !key.includes('website')) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE komik_websites SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async delete(id) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM komik_websites WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    const values = result[0].values;

    console.log(`[DEBUG] _parseResult:`, {
      hasColumns: !!columns,
      columnsCount: columns?.length,
      hasValues: !!values,
      valuesCount: values?.length,
      firstRow: values?.[0]
    });

    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = KomikWebsite;
