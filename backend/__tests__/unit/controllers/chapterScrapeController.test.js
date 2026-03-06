jest.mock('../../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
}));

jest.mock('../../../models/Chapter', () => ({
  upsertBatch: jest.fn(),
  findByKomikWebsiteId: jest.fn(),
}));

jest.mock('../../../models/KomikWebsite', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../utils/chapterParser', () => ({
  parseChapterNumber: jest.fn(),
}));

const chapterScrapeController = require('../../../controllers/chapterScrapeController');
const scraperClient = require('../../../middleware/scraperClient');
const Chapter = require('../../../models/Chapter');
const KomikWebsite = require('../../../models/KomikWebsite');
const { parseChapterNumber } = require('../../../utils/chapterParser');

describe('chapterScrapeController', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('scrapeChapters', () => {
    it('returns 404 when komik_website not found', async () => {
      req.params.id = '999';
      KomikWebsite.findById.mockResolvedValue(null);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(KomikWebsite.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Komik website not found' });
    });

    it('scrapes chapters, parses, upserts, and updates komik_website', async () => {
      req.params.id = '1';
      KomikWebsite.findById.mockResolvedValue({ id: 1, url: 'https://example.com/manga/test' });
      scraperClient.getChapters.mockResolvedValue({
        data: [
          { chapter: 'Ch 1', url: '/ch-1' },
          { chapter: 'Ch 2', url: '/ch-2' },
          { chapter: 'Ch 3', url: '/ch-3' },
        ],
      });
      parseChapterNumber
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3);
      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(scraperClient.getChapters).toHaveBeenCalledWith('https://example.com/manga/test', 'normal');
      expect(parseChapterNumber).toHaveBeenCalledTimes(3);
      expect(Chapter.upsertBatch).toHaveBeenCalledWith('1', [
        { chapter_number: 1, url: '/ch-1' },
        { chapter_number: 2, url: '/ch-2' },
        { chapter_number: 3, url: '/ch-3' },
      ]);
      expect(KomikWebsite.update).toHaveBeenCalledWith('1', {
        total_chapters: 3,
        last_checked_at: expect.any(String),
      });
      expect(res.json).toHaveBeenCalledWith({
        data: {
          komik_website_id: '1',
          chapters_found: 3,
          skipped: 0,
        },
      });
    });

    it('skips chapters where parseChapterNumber returns null', async () => {
      req.params.id = '1';
      KomikWebsite.findById.mockResolvedValue({ id: 1, url: 'https://example.com/manga/test' });
      scraperClient.getChapters.mockResolvedValue({
        data: [
          { chapter: 'Ch 1', url: '/ch-1' },
          { chapter: 'Prologue', url: '/prologue' },
          { chapter: 'Ch 3', url: '/ch-3' },
        ],
      });
      parseChapterNumber
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(3);
      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.scrapeChapters(req, res);

      expect(Chapter.upsertBatch).toHaveBeenCalledWith('1', [
        { chapter_number: 1, url: '/ch-1' },
        { chapter_number: 3, url: '/ch-3' },
      ]);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          komik_website_id: '1',
          chapters_found: 2,
          skipped: 1,
        },
      });
    });

    it('returns 500 on unexpected error', async () => {
      req.params.id = '1';
      KomikWebsite.findById.mockRejectedValue(new Error('DB error'));

      await chapterScrapeController.scrapeChapters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('syncAll', () => {
    it('syncs all komik websites successfully', async () => {
      KomikWebsite.findAll.mockResolvedValue([
        { id: 1, url: 'https://example.com/manga/a' },
        { id: 2, url: 'https://example.com/manga/b' },
      ]);
      scraperClient.getChapters
        .mockResolvedValueOnce({
          data: [{ chapter: 'Ch 1', url: '/a-1' }],
        })
        .mockResolvedValueOnce({
          data: [{ chapter: 'Ch 1', url: '/b-1' }, { chapter: 'Ch 2', url: '/b-2' }],
        });
      parseChapterNumber.mockReturnValue(1);
      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.syncAll(req, res);

      expect(KomikWebsite.findAll).toHaveBeenCalled();
      expect(scraperClient.getChapters).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          total: 2,
          success: 2,
          failed: 0,
          errors: [],
        },
      });
    });

    it('catches errors per-item and continues syncing', async () => {
      KomikWebsite.findAll.mockResolvedValue([
        { id: 1, url: 'https://example.com/manga/a' },
        { id: 2, url: 'https://example.com/manga/b' },
      ]);
      scraperClient.getChapters
        .mockRejectedValueOnce(new Error('Scraper timeout'))
        .mockResolvedValueOnce({
          data: [{ chapter: 'Ch 1', url: '/b-1' }],
        });
      parseChapterNumber.mockReturnValue(1);
      Chapter.upsertBatch.mockResolvedValue();
      KomikWebsite.update.mockResolvedValue(true);

      await chapterScrapeController.syncAll(req, res);

      expect(scraperClient.getChapters).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          total: 2,
          success: 1,
          failed: 1,
          errors: [
            { id: 1, url: 'https://example.com/manga/a', error: 'Scraper timeout' },
          ],
        },
      });
    });

    it('returns 500 if findAll itself throws', async () => {
      KomikWebsite.findAll.mockRejectedValue(new Error('DB down'));

      await chapterScrapeController.syncAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getChapters', () => {
    it('returns 404 when komik_website not found', async () => {
      req.params.id = '42';
      KomikWebsite.findById.mockResolvedValue(null);

      await chapterScrapeController.getChapters(req, res);

      expect(KomikWebsite.findById).toHaveBeenCalledWith('42');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Komik website not found' });
    });

    it('returns chapters for a valid komik_website', async () => {
      req.params.id = '1';
      KomikWebsite.findById.mockResolvedValue({ id: 1, url: 'https://example.com/manga/test' });
      Chapter.findByKomikWebsiteId.mockResolvedValue([
        { id: 1, komik_website_id: 1, chapter_number: 2, url: '/ch-2' },
        { id: 2, komik_website_id: 1, chapter_number: 1, url: '/ch-1' },
      ]);

      await chapterScrapeController.getChapters(req, res);

      expect(Chapter.findByKomikWebsiteId).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 1, komik_website_id: 1, chapter_number: 2, url: '/ch-2' },
          { id: 2, komik_website_id: 1, chapter_number: 1, url: '/ch-1' },
        ],
      });
    });

    it('returns 500 on unexpected error', async () => {
      req.params.id = '1';
      KomikWebsite.findById.mockRejectedValue(new Error('DB error'));

      await chapterScrapeController.getChapters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
