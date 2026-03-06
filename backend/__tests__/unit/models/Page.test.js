jest.mock('../../../config/sqlite', () => {
  const mockDb = { run: jest.fn(), exec: jest.fn() };
  return { getDb: jest.fn().mockResolvedValue(mockDb), save: jest.fn(), _mockDb: mockDb };
});

const sqlite = require('../../../config/sqlite');
const mockDb = sqlite._mockDb;

// Require after mock is set up
const Page = require('../../../models/Page');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Page model', () => {
  describe('findByChapterId', () => {
    it('returns parsed rows ordered by page_number ASC', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'chapter_id', 'page_number', 'image_url', 'created_at', 'updated_at'],
        values: [
          [1, 10, 1, 'http://img.com/1.jpg', '2024-01-01', '2024-01-01'],
          [2, 10, 2, 'http://img.com/2.jpg', '2024-01-01', '2024-01-01'],
        ]
      }]);

      const result = await Page.findByChapterId(10);

      expect(sqlite.getDb).toHaveBeenCalled();
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM pages WHERE chapter_id = ?'),
        [10]
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY page_number ASC'),
        [10]
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        chapter_id: 10,
        page_number: 1,
        image_url: 'http://img.com/1.jpg',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      });
    });

    it('returns empty array when no results', async () => {
      mockDb.exec.mockReturnValue([]);

      const result = await Page.findByChapterId(999);
      expect(result).toEqual([]);
    });
  });

  describe('insertBatch', () => {
    it('inserts each page and saves once at the end', async () => {
      const pages = [
        { page_number: 1, image_url: 'http://img.com/1.jpg' },
        { page_number: 2, image_url: 'http://img.com/2.jpg' },
        { page_number: 3, image_url: 'http://img.com/3.jpg' },
      ];

      await Page.insertBatch(10, pages);

      expect(sqlite.getDb).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledTimes(3);
      expect(mockDb.run).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT OR REPLACE INTO pages'),
        [10, 1, 'http://img.com/1.jpg']
      );
      expect(mockDb.run).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT OR REPLACE INTO pages'),
        [10, 2, 'http://img.com/2.jpg']
      );
      expect(mockDb.run).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT OR REPLACE INTO pages'),
        [10, 3, 'http://img.com/3.jpg']
      );
      expect(sqlite.save).toHaveBeenCalledTimes(1);
    });

    it('does not call save when pages array is empty', async () => {
      await Page.insertBatch(10, []);

      expect(mockDb.run).not.toHaveBeenCalled();
      expect(sqlite.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteByChapterId', () => {
    it('deletes all pages for a chapter and saves', async () => {
      await Page.deleteByChapterId(10);

      expect(sqlite.getDb).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM pages WHERE chapter_id = ?'),
        [10]
      );
      expect(sqlite.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasPages', () => {
    it('returns true when count > 0', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['count'],
        values: [[5]]
      }]);

      const result = await Page.hasPages(10);

      expect(sqlite.getDb).toHaveBeenCalled();
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        [10]
      );
      expect(result).toBe(true);
    });

    it('returns false when count is 0', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['count'],
        values: [[0]]
      }]);

      const result = await Page.hasPages(10);
      expect(result).toBe(false);
    });
  });

  describe('_parseResult', () => {
    it('converts sql.js result format to array of objects', () => {
      const result = [{
        columns: ['id', 'chapter_id', 'page_number'],
        values: [
          [1, 10, 1],
          [2, 10, 2],
        ]
      }];

      const parsed = Page._parseResult(result);
      expect(parsed).toEqual([
        { id: 1, chapter_id: 10, page_number: 1 },
        { id: 2, chapter_id: 10, page_number: 2 },
      ]);
    });

    it('returns empty array for empty/null result', () => {
      expect(Page._parseResult([])).toEqual([]);
      expect(Page._parseResult(null)).toEqual([]);
      expect(Page._parseResult(undefined)).toEqual([]);
    });
  });
});
