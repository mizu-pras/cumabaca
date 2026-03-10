const sqlite = require('../config/sqlite');

class KomikGenre {
  static async setGenres(komikId, genreIds) {
    const db = await sqlite.getDb();
    // Remove existing associations
    db.run('DELETE FROM komik_genres WHERE komik_id = ?', [komikId]);
    // Insert new associations
    for (const genreId of genreIds) {
      try {
        db.run('INSERT INTO komik_genres (komik_id, genre_id) VALUES (?, ?)', [komikId, genreId]);
      } catch (e) {
        // Duplicate — ignore
      }
    }
    sqlite.save();
  }

  static async addGenre(komikId, genreId) {
    const db = await sqlite.getDb();
    try {
      db.run('INSERT INTO komik_genres (komik_id, genre_id) VALUES (?, ?)', [komikId, genreId]);
      sqlite.save();
    } catch (e) {
      // Already exists — ignore
    }
  }
}

module.exports = KomikGenre;
