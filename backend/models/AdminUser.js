const db = require('../config/sqlite');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class AdminUser {
  static create({ username, password, email }) {
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare(
      'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)'
    );
    return stmt.run(username, passwordHash, email);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE id = ?');
    return stmt.get(id);
  }

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static updateLastLogin(id) {
    const stmt = db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }

  static toJSON(user) {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = AdminUser;
