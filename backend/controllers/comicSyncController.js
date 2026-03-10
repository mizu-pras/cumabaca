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
      const { page = 1 } = req.query;
      const website = await Website.findById(id);

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      // Get existing URLs to avoid duplicates
      const existingKomikWebsites = await KomikWebsite.findAll({ website_id: id });
      const knownUrls = new Set(existingKomikWebsites.map(kw => kw.url));

      // Fetch one page of comics from scraper
      const result = await scraperClient.getComics(website.url, parseInt(page));
      const comics = result.data || [];

      let created = 0;
      let skipped = 0;

      for (const comic of comics) {
        const comicUrl = comic.url.startsWith('http')
          ? comic.url
          : website.url.replace(/\/$/, '') + comic.url;

        if (knownUrls.has(comicUrl)) {
          skipped++;
          continue;
        }

        const type = normalizeType(comic.type);
        const genreName = comic.genre ? normalizeGenre(comic.genre) : null;

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

        if (genreName) {
          const genre = await Genre.findOrCreate(genreName);
          await KomikGenre.addGenre(komik.id, genre.id);
        }

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
          skipped++;
        }
      }

      res.json({
        data: {
          website_id: id,
          page: parseInt(page),
          hasNextPage: result.hasNextPage,
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
