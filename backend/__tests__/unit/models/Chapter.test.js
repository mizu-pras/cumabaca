jest.mock('../../../config/sqlite', () => {
  const mockDb = { run: jest.fn(), exec: jest.fn() };
  return { getDb: jest.fn().mockResolvedValue(mockDb), save: jest.fn(), _mockDb: mockDb };
});

const sqlite = require('../../../config/sqlite');
const mockDb = sqlite._mockDb;

let Chapter;

beforeAll(() => {
  Chapter = require('../../../models/Chapter');
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chapter', () => {
  describe('create', () => {
    it('inserts a chapter and returns { id }', async () => {
      mockDb.exec.mockReturnValue([{ values: [[42]] }]);

      const result = await Chapter.create({
        komik_website_id: 1,
        chapter_number: 10.5,
        url: 'https://example.com/ch-10-5',
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chapters'),
        [1, 10.5, 'https://example.com/ch-10-5']
      );
      expect(mockDb.exec).toHaveBeenCalledWith('SELECT last_insert_rowid() as id');
      expect(sqlite.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 42 });
    });
  });

  describe('findByKomikWebsiteId', () => {
    it('returns chapters ordered by chapter_number DESC', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'komik_website_id', 'chapter_number', 'url', 'created_at', 'updated_at'],
        values: [
          [2, 1, 20, 'https://example.com/ch-20', '2024-01-02', '2024-01-02'],
          [1, 1, 10, 'https://example.com/ch-10', '2024-01-01', '2024-01-01'],
        ],
      }]);

      const result = await Chapter.findByKomikWebsiteId(1);

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('WHERE komik_website_id = ?'),
        [1]
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY chapter_number DESC'),
        expect.any(Array)
      );
      expect(result).toHaveLength(2);
      expect(result[0].chapter_number).toBe(20);
      expect(result[1].chapter_number).toBe(10);
    });

    it('returns empty array when no results', async () => {
      mockDb.exec.mockReturnValue([]);

      const result = await Chapter.findByKomikWebsiteId(999);

      expect(result).toEqual([]);
    });

    it('supports pagination with limit and page', async () => {
      mockDb.exec.mockReturnValue([]);

      await Chapter.findByKomikWebsiteId(1, { limit: 10, page: 3 });

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [1, 10, 20] // page 3, limit 10 => offset 20
      );
    });

    it('defaults page to 1 when limit given without page', async () => {
      mockDb.exec.mockReturnValue([]);

      await Chapter.findByKomikWebsiteId(1, { limit: 5 });

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [1, 5, 0] // page defaults to 1 => offset 0
      );
    });
  });

  describe('findById', () => {
    it('returns a single chapter object', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'komik_website_id', 'chapter_number', 'url', 'created_at', 'updated_at'],
        values: [[5, 1, 15, 'https://example.com/ch-15', '2024-01-01', '2024-01-01']],
      }]);

      const result = await Chapter.findById(5);

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [5]
      );
      expect(result).toEqual({
        id: 5,
        komik_website_id: 1,
        chapter_number: 15,
        url: 'https://example.com/ch-15',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      });
    });

    it('returns null when chapter not found', async () => {
      mockDb.exec.mockReturnValue([]);

      const result = await Chapter.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('upsertBatch', () => {
    it('runs INSERT OR REPLACE for each chapter and saves once', async () => {
      const chapters = [
        { chapter_number: 1, url: 'https://example.com/ch-1' },
        { chapter_number: 2, url: 'https://example.com/ch-2' },
        { chapter_number: 3, url: 'https://example.com/ch-3' },
      ];

      await Chapter.upsertBatch(7, chapters);

      expect(mockDb.run).toHaveBeenCalledTimes(3);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO chapters'),
        [7, 1, 'https://example.com/ch-1']
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO chapters'),
        [7, 2, 'https://example.com/ch-2']
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO chapters'),
        [7, 3, 'https://example.com/ch-3']
      );
      // save should only be called once at the end
      expect(sqlite.save).toHaveBeenCalledTimes(1);
    });

    it('handles empty array without error', async () => {
      await Chapter.upsertBatch(7, []);

      expect(mockDb.run).not.toHaveBeenCalled();
      expect(sqlite.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLatestChapterNumber', () => {
    it('returns the max chapter_number', async () => {
      mockDb.exec.mockReturnValue([{ values: [[45.5]] }]);

      const result = await Chapter.getLatestChapterNumber(1);

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('SELECT MAX(chapter_number)'),
        [1]
      );
      expect(result).toBe(45.5);
    });

    it('returns 0 when no chapters exist (null result)', async () => {
      mockDb.exec.mockReturnValue([{ values: [[null]] }]);

      const result = await Chapter.getLatestChapterNumber(999);

      expect(result).toBe(0);
    });
  });

  describe('deleteByKomikWebsiteId', () => {
    it('deletes all chapters for a komik_website_id and saves', async () => {
      await Chapter.deleteByKomikWebsiteId(3);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM chapters WHERE komik_website_id = ?'),
        [3]
      );
      expect(sqlite.save).toHaveBeenCalled();
    });
  });

  describe('_parseResult', () => {
    it('converts sql.js result format to array of objects', () => {
      const result = [{
        columns: ['id', 'name'],
        values: [
          [1, 'first'],
          [2, 'second'],
        ],
      }];

      const parsed = Chapter._parseResult(result);

      expect(parsed).toEqual([
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
      ]);
    });

    it('returns empty array for empty result', () => {
      expect(Chapter._parseResult([])).toEqual([]);
      expect(Chapter._parseResult(null)).toEqual([]);
      expect(Chapter._parseResult(undefined)).toEqual([]);
    });
  });
});
