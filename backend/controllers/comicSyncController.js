const scraperClient = require('../middleware/scraperClient');
const Komik = require('../models/Komik');
const KomikWebsite = require('../models/KomikWebsite');
const Genre = require('../models/Genre');
const KomikGenre = require('../models/KomikGenre');
const Website = require('../models/Website');
const { normalizeGenre, normalizeType } = require('../utils/genreNormalizer');

const comicSyncController = {
  async syncComics(req, res) {
    try {
      const { id } = req.params;
      const website = await Website.findById(id);

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      // Find most recent known comic URL for incremental sync
      const existingKomikWebsites = await KomikWebsite.findAll({ website_id: id });
      const knownUrls = new Set(existingKomikWebsites.map(kw => kw.url));
      const stopAtUrl = existingKomikWebsites.length > 0
        ? existingKomikWebsites[0]?.url  // Most recent (ordered by id DESC)
        : null;

      // Call scraper
      const result = await scraperClient.getComics(website.url, stopAtUrl);
      const comics = result.data || [];

      let created = 0;
      let skipped = 0;

      for (const comic of comics) {
        // Build full URL
        const comicUrl = comic.url.startsWith('http')
          ? comic.url
          : website.url.replace(/\/$/, '') + comic.url;

        // Skip if this URL already exists for this website
        if (knownUrls.has(comicUrl)) {
          skipped++;
          continue;
        }

        // Normalize type and genre
        const type = normalizeType(comic.type);
        const genreName = comic.genre ? normalizeGenre(comic.genre) : null;

        // Find or create Komik by title
        let komik = await Komik.findByTitle(comic.title);
        if (!komik) {
          const createResult = await Komik.create({
            title: comic.title,
            cover_image: comic.cover,
            language_id: website.language_id,
            type,
          });
          komik = { id: createResult.id };
        }

        // Handle genre
        if (genreName) {
          const genre = await Genre.findOrCreate(genreName);
          await KomikGenre.addGenre(komik.id, genre.id);
        }

        // Create KomikWebsite link
        try {
          await KomikWebsite.create({
            komik_id: komik.id,
            website_id: parseInt(id),
            url: comicUrl,
            cover: comic.cover,
          });
          knownUrls.add(comicUrl);
          created++;
        } catch (e) {
          // UNIQUE constraint — already linked
          skipped++;
        }
      }

      res.json({
        data: {
          website_id: id,
          total_scraped: comics.length,
          created,
          skipped,
        },
      });
    } catch (error) {
      console.error('Sync comics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = comicSyncController;
