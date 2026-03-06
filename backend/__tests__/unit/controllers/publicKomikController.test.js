const mockDb = {
  exec: jest.fn(),
};

jest.mock('../../../config/sqlite', () => ({
  getDb: jest.fn().mockResolvedValue(mockDb),
}));

jest.mock('../../../models/Chapter', () => ({
  findByKomikWebsiteId: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../../models/Page', () => ({
  findByChapterId: jest.fn(),
  insertBatch: jest.fn(),
  hasPages: jest.fn(),
}));

jest.mock('../../../middleware/scraperClient', () => ({
  getData: jest.fn(),
}));

const { listKomiks, getChapters, getPages } = require('../../../controllers/publicKomikController');
const Chapter = require('../../../models/Chapter');
const Page = require('../../../models/Page');
const scraperClient = require('../../../middleware/scraperClient');

describe('publicKomikController', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('listKomiks', () => {
    it('returns paginated data with best source and fallback chain', async () => {
      // Count query
      mockDb.exec.mockReturnValueOnce([{
        columns: ['total'],
        values: [[2]],
      }]);
      // Main query
      mockDb.exec.mockReturnValueOnce([{
        columns: [
          'id', 'title', 'cover_image', 'synopsis', 'status',
          'language_name',
          'source_website_id', 'source_website_name', 'source_url', 'source_cover', 'source_synopsis', 'latest_chapter',
        ],
        values: [
          [1, 'Manga A', 'komik-cover.jpg', 'Komik synopsis', 'ongoing', 'Indonesian', 3, 'komiku.org', 'https://komiku.org/manga-a', 'source-cover.jpg', 'Source synopsis', 1120],
          [2, 'Manga B', null, null, 'completed', 'English', 5, 'komikcast.fit', 'https://komikcast.fit/manga-b', 'fallback-cover.jpg', 'Fallback synopsis', 50],
        ],
      }]);

      await listKomiks(req, res);

      expect(mockDb.exec).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          {
            id: 1,
            title: 'Manga A',
            cover_image: 'komik-cover.jpg',
            synopsis: 'Komik synopsis',
            status: 'ongoing',
            language: 'Indonesian',
            source: {
              website_id: 3,
              website_name: 'komiku.org',
              url: 'https://komiku.org/manga-a',
              latest_chapter: 1120,
            },
          },
          {
            id: 2,
            title: 'Manga B',
            cover_image: 'fallback-cover.jpg',
            synopsis: 'Fallback synopsis',
            status: 'completed',
            language: 'English',
            source: {
              website_id: 5,
              website_name: 'komikcast.fit',
              url: 'https://komikcast.fit/manga-b',
              latest_chapter: 50,
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
        },
      });
    });

    it('applies pagination from query params', async () => {
      req.query = { page: '2', limit: '10' };

      mockDb.exec.mockReturnValueOnce([{ columns: ['total'], values: [[25]] }]);
      mockDb.exec.mockReturnValueOnce([{ columns: ['id', 'title', 'cover_image', 'synopsis', 'status', 'language_name', 'source_website_id', 'source_website_name', 'source_url', 'source_cover', 'source_synopsis', 'latest_chapter'], values: [] }]);

      await listKomiks(req, res);

      // Verify pagination in the main query call
      const mainCall = mockDb.exec.mock.calls[1];
      const params = mainCall[1];
      // LIMIT should be 10, OFFSET should be 10 (page 2 * limit 10 - limit 10)
      expect(params).toContain(10); // limit
      expect(params).toContain(10); // offset = (2-1)*10

      expect(res.json).toHaveBeenCalledWith({
        data: [],
        pagination: { page: 2, limit: 10, total: 25 },
      });
    });

    it('filters by language_id', async () => {
      req.query = { language: '2' };

      mockDb.exec.mockReturnValueOnce([{ columns: ['total'], values: [[5]] }]);
      mockDb.exec.mockReturnValueOnce([{ columns: ['id', 'title', 'cover_image', 'synopsis', 'status', 'language_name', 'source_website_id', 'source_website_name', 'source_url', 'source_cover', 'source_synopsis', 'latest_chapter'], values: [] }]);

      await listKomiks(req, res);

      // Both count and main queries should include language filter
      const countSql = mockDb.exec.mock.calls[0][0];
      const mainSql = mockDb.exec.mock.calls[1][0];
      expect(countSql).toContain('k.language_id = ?');
      expect(mainSql).toContain('k.language_id = ?');
    });

    it('filters by search term', async () => {
      req.query = { search: 'dragon' };

      mockDb.exec.mockReturnValueOnce([{ columns: ['total'], values: [[1]] }]);
      mockDb.exec.mockReturnValueOnce([{ columns: ['id', 'title', 'cover_image', 'synopsis', 'status', 'language_name', 'source_website_id', 'source_website_name', 'source_url', 'source_cover', 'source_synopsis', 'latest_chapter'], values: [] }]);

      await listKomiks(req, res);

      const countSql = mockDb.exec.mock.calls[0][0];
      const mainSql = mockDb.exec.mock.calls[1][0];
      expect(countSql).toContain('k.title LIKE ?');
      expect(mainSql).toContain('k.title LIKE ?');
    });

    it('filters by status', async () => {
      req.query = { status: 'completed' };

      mockDb.exec.mockReturnValueOnce([{ columns: ['total'], values: [[3]] }]);
      mockDb.exec.mockReturnValueOnce([{ columns: ['id', 'title', 'cover_image', 'synopsis', 'status', 'language_name', 'source_website_id', 'source_website_name', 'source_url', 'source_cover', 'source_synopsis', 'latest_chapter'], values: [] }]);

      await listKomiks(req, res);

      const countSql = mockDb.exec.mock.calls[0][0];
      const mainSql = mockDb.exec.mock.calls[1][0];
      expect(countSql).toContain('k.status = ?');
      expect(mainSql).toContain('k.status = ?');
    });

    it('returns empty data when count is 0', async () => {
      mockDb.exec.mockReturnValueOnce([{ columns: ['total'], values: [[0]] }]);

      await listKomiks(req, res);

      // Should not run main query
      expect(mockDb.exec).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        pagination: { page: 1, limit: 20, total: 0 },
      });
    });

    it('returns 500 on database error', async () => {
      mockDb.exec.mockImplementation(() => { throw new Error('DB error'); });

      await listKomiks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getChapters', () => {
    it('returns chapters from best source', async () => {
      req.params.id = '1';

      // Best source query
      mockDb.exec.mockReturnValueOnce([{
        columns: ['id'],
        values: [[10]],
      }]);

      Chapter.findByKomikWebsiteId.mockResolvedValue([
        { id: 100, komik_website_id: 10, chapter_number: 5, url: '/ch-5' },
        { id: 99, komik_website_id: 10, chapter_number: 4, url: '/ch-4' },
      ]);

      await getChapters(req, res);

      expect(Chapter.findByKomikWebsiteId).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 100, komik_website_id: 10, chapter_number: 5, url: '/ch-5' },
          { id: 99, komik_website_id: 10, chapter_number: 4, url: '/ch-4' },
        ],
      });
    });

    it('returns 404 when no sources found', async () => {
      req.params.id = '999';

      mockDb.exec.mockReturnValueOnce([]);

      await getChapters(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No sources found for this komik' });
    });

    it('returns 500 on database error', async () => {
      req.params.id = '1';
      mockDb.exec.mockImplementation(() => { throw new Error('DB error'); });

      await getChapters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getPages', () => {
    it('returns cached pages when they exist', async () => {
      req.params.chapterId = '100';
      Page.hasPages.mockResolvedValue(true);
      Page.findByChapterId.mockResolvedValue([
        { id: 1, chapter_id: 100, page_number: 1, image_url: 'img1.jpg' },
        { id: 2, chapter_id: 100, page_number: 2, image_url: 'img2.jpg' },
      ]);

      await getPages(req, res);

      expect(Page.hasPages).toHaveBeenCalledWith('100');
      expect(Page.findByChapterId).toHaveBeenCalledWith('100');
      expect(scraperClient.getData).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 1, chapter_id: 100, page_number: 1, image_url: 'img1.jpg' },
          { id: 2, chapter_id: 100, page_number: 2, image_url: 'img2.jpg' },
        ],
      });
    });

    it('lazy loads pages from scraper when not cached', async () => {
      req.params.chapterId = '100';
      Page.hasPages.mockResolvedValue(false);
      Chapter.findById.mockResolvedValue({ id: 100, url: 'https://komiku.org/ch-100' });
      scraperClient.getData.mockResolvedValue({
        data: { title: 'Chapter 100', data: ['img1.jpg', 'img2.jpg', 'img3.jpg'] },
      });
      Page.insertBatch.mockResolvedValue();
      Page.findByChapterId.mockResolvedValue([
        { id: 1, chapter_id: 100, page_number: 1, image_url: 'img1.jpg' },
        { id: 2, chapter_id: 100, page_number: 2, image_url: 'img2.jpg' },
        { id: 3, chapter_id: 100, page_number: 3, image_url: 'img3.jpg' },
      ]);

      await getPages(req, res);

      expect(Page.hasPages).toHaveBeenCalledWith('100');
      expect(Chapter.findById).toHaveBeenCalledWith('100');
      expect(scraperClient.getData).toHaveBeenCalledWith('https://komiku.org/ch-100', 'normal');
      expect(Page.insertBatch).toHaveBeenCalledWith('100', [
        { page_number: 1, image_url: 'img1.jpg' },
        { page_number: 2, image_url: 'img2.jpg' },
        { page_number: 3, image_url: 'img3.jpg' },
      ]);
      expect(Page.findByChapterId).toHaveBeenCalledWith('100');
      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 1, chapter_id: 100, page_number: 1, image_url: 'img1.jpg' },
          { id: 2, chapter_id: 100, page_number: 2, image_url: 'img2.jpg' },
          { id: 3, chapter_id: 100, page_number: 3, image_url: 'img3.jpg' },
        ],
      });
    });

    it('returns 404 when chapter not found during lazy load', async () => {
      req.params.chapterId = '999';
      Page.hasPages.mockResolvedValue(false);
      Chapter.findById.mockResolvedValue(null);

      await getPages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Chapter not found' });
    });

    it('returns 500 on unexpected error', async () => {
      req.params.chapterId = '100';
      Page.hasPages.mockRejectedValue(new Error('DB error'));

      await getPages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
