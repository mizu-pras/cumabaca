jest.mock('../../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
  getData: jest.fn(),
}));

jest.mock('../../../config/websites', () => ({
  websites: {
    komiku: {
      name: 'Komiku',
      domains: ['komiku.org'],
      baseUrl: 'https://komiku.org',
      nsfw: false,
    },
    sektedoujin: {
      name: 'Sektedoujin',
      domains: ['sektedoujin.cc'],
      baseUrl: 'https://sektedoujin.cc',
      nsfw: true,
    },
  },
}));

const { getChapters, getChapterData } = require('../../../controllers/komikController');
const scraperClient = require('../../../middleware/scraperClient');

describe('komikController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getChapters', () => {
    it('returns 400 when URL is missing', async () => {
      await getChapters(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'URL parameter is required',
      }));
    });

    it('returns 400 for unsupported domain', async () => {
      req.query.url = 'https://unsupported.com/manga';
      await getChapters(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unsupported website URL',
      }));
    });

    it('returns 403 for NSFW site without secret mode', async () => {
      req.query.url = 'https://sektedoujin.cc/manga/test';
      req.query.mode = 'normal';
      await getChapters(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'This content requires secret mode',
        nsfw: true,
      }));
    });

    it('allows NSFW site with secret mode', async () => {
      req.query.url = 'https://sektedoujin.cc/manga/test';
      req.query.mode = 'secret';
      scraperClient.getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1' }] });

      await getChapters(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: [{ chapter: 'Ch 1' }] });
    });

    it('auto-fixes URL missing protocol', async () => {
      req.query.url = 'komiku.org/manga/test';
      scraperClient.getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1' }] });

      await getChapters(req, res, next);

      expect(scraperClient.getChapters).toHaveBeenCalledWith(
        'https://komiku.org/manga/test',
        'normal'
      );
    });

    it('returns 404 for empty results', async () => {
      req.query.url = 'https://komiku.org/manga/test';
      scraperClient.getChapters.mockResolvedValue({ data: [] });

      await getChapters(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 504 when scraper is unavailable', async () => {
      req.query.url = 'https://komiku.org/manga/test';
      scraperClient.getChapters.mockRejectedValue(new Error('Scraper service unavailable'));

      await getChapters(req, res, next);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Scraper service unavailable'),
      }));
    });

    it('passes non-scraper errors to next()', async () => {
      req.query.url = 'https://komiku.org/manga/test';
      const error = new Error('Random error');
      scraperClient.getChapters.mockRejectedValue(error);

      await getChapters(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('returns successful response with data', async () => {
      req.query.url = 'https://komiku.org/manga/test';
      scraperClient.getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1', url: '/ch-1' }] });

      await getChapters(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: [{ chapter: 'Ch 1', url: '/ch-1' }],
      });
    });
  });

  describe('getChapterData', () => {
    it('returns 400 when URL is missing', async () => {
      await getChapterData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for unsupported domain', async () => {
      req.query.url = 'https://unknown.com/ch-1';
      await getChapterData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 403 for NSFW without secret mode', async () => {
      req.query.url = 'https://sektedoujin.cc/ch-1';
      await getChapterData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('unwraps scraper response for backward compatibility', async () => {
      req.query.url = 'https://komiku.org/ch-1';
      scraperClient.getData.mockResolvedValue({
        data: { title: 'Ch 1 Title', data: ['img1.jpg', 'img2.jpg'] },
      });

      await getChapterData(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        title: 'Ch 1 Title',
        data: ['img1.jpg', 'img2.jpg'],
      });
    });

    it('returns 504 when scraper is unavailable', async () => {
      req.query.url = 'https://komiku.org/ch-1';
      scraperClient.getData.mockRejectedValue(new Error('Scraper service unavailable'));

      await getChapterData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(504);
    });
  });
});
