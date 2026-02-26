const sqlite = require('../config/sqlite');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class AdminUser {
  static async create({ username, password, email }) {
    const db = await sqlite.getDb();
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

    db.run(
      'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, passwordHash, email]
    );
    sqlite.save();

    // Get the last insert rowid
    const lastId = db.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = lastId[0]?.values[0]?.[0] ?? 0;
    return { lastInsertRowid };
  }

  static async findByUsername(username) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (result.length === 0) return null;

    const columns = result[0].columns;
    const values = result[0].values[0];
    const user = {};
    columns.forEach((col, i) => {
      user[col] = values[i];
    });

    return user;
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM admin_users WHERE id = ?', [id]);

    if (result.length === 0) return null;

    const columns = result[0].columns;
    const values = result[0].values[0];
    const user = {};
    columns.forEach((col, i) => {
      user[col] = values[i];
    });

    return user;
  }

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static async updateLastLogin(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
  }

  static toJSON(user) {
    if (!user) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = AdminUser;
