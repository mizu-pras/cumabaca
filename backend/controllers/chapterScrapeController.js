const scraperClient = require('../middleware/scraperClient');
const Chapter = require('../models/Chapter');
const KomikWebsite = require('../models/KomikWebsite');
const { parseChapterNumber } = require('../utils/chapterParser');

const chapterScrapeController = {
  async scrapeChapters(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'Komik website not found' });
      }

      const result = await scraperClient.getChapters(komikWebsite.url, 'normal');
      const rawChapters = result.data || [];

      const parsedChapters = [];
      let skipped = 0;

      for (const ch of rawChapters) {
        const chapterNumber = parseChapterNumber(ch.chapter);
        if (chapterNumber === null) {
          skipped++;
          continue;
        }
        parsedChapters.push({ chapter_number: chapterNumber, url: ch.url });
      }

      await Chapter.upsertBatch(id, parsedChapters);
      await KomikWebsite.update(id, {
        total_chapters: parsedChapters.length,
        last_checked_at: new Date().toISOString(),
      });

      res.json({
        data: {
          komik_website_id: id,
          chapters_found: parsedChapters.length,
          skipped,
        },
      });
    } catch (error) {
      console.error('Scrape chapters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async syncAll(req, res) {
    try {
      const komikWebsites = await KomikWebsite.findAll();
      let success = 0;
      let failed = 0;
      const errors = [];

      for (const kw of komikWebsites) {
        try {
          const result = await scraperClient.getChapters(kw.url, 'normal');
          const rawChapters = result.data || [];

          const parsedChapters = [];
          for (const ch of rawChapters) {
            const chapterNumber = parseChapterNumber(ch.chapter);
            if (chapterNumber === null) continue;
            parsedChapters.push({ chapter_number: chapterNumber, url: ch.url });
          }

          await Chapter.upsertBatch(kw.id, parsedChapters);
          await KomikWebsite.update(kw.id, {
            total_chapters: parsedChapters.length,
            last_checked_at: new Date().toISOString(),
          });

          success++;
        } catch (err) {
          failed++;
          errors.push({ id: kw.id, url: kw.url, error: err.message });
        }
      }

      res.json({
        data: {
          total: komikWebsites.length,
          success,
          failed,
          errors,
        },
      });
    } catch (error) {
      console.error('Sync all chapters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getChapters(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'Komik website not found' });
      }

      const chapters = await Chapter.findByKomikWebsiteId(id);
      res.json({ data: chapters });
    } catch (error) {
      console.error('Get chapters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = chapterScrapeController;
