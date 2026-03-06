jest.mock('../../../config/sqlite', () => {
  const mockDb = { run: jest.fn(), exec: jest.fn() };
  return { getDb: jest.fn().mockResolvedValue(mockDb), save: jest.fn(), _mockDb: mockDb };
});

const sqlite = require('../../../config/sqlite');
const mockDb = sqlite._mockDb;

let KomikWebsite;

beforeAll(() => {
  KomikWebsite = require('../../../models/KomikWebsite');
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('KomikWebsite', () => {
  describe('create', () => {
    it('inserts a komik_website with cover and synopsis and returns { id }', async () => {
      mockDb.exec.mockReturnValue([{ values: [[7]] }]);

      const result = await KomikWebsite.create({
        komik_id: 1,
        website_id: 2,
        url: 'https://example.com/comic-1',
        cover: 'https://example.com/cover.jpg',
        synopsis: 'A great comic about testing.',
        total_chapters: 50,
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO komik_websites'),
        [1, 2, 'https://example.com/comic-1', 'https://example.com/cover.jpg', 'A great comic about testing.', 50]
      );
      expect(mockDb.exec).toHaveBeenCalledWith('SELECT last_insert_rowid() as id');
      expect(sqlite.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 7 });
    });

    it('defaults cover and synopsis to null when not provided', async () => {
      mockDb.exec.mockReturnValue([{ values: [[8]] }]);

      await KomikWebsite.create({
        komik_id: 1,
        website_id: 2,
        url: 'https://example.com/comic-2',
        total_chapters: 10,
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO komik_websites'),
        [1, 2, 'https://example.com/comic-2', null, null, 10]
      );
    });

    it('defaults total_chapters to 0 when not provided', async () => {
      mockDb.exec.mockReturnValue([{ values: [[9]] }]);

      await KomikWebsite.create({
        komik_id: 1,
        website_id: 2,
        url: 'https://example.com/comic-3',
        cover: 'https://example.com/cover3.jpg',
        synopsis: 'Synopsis here.',
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO komik_websites'),
        [1, 2, 'https://example.com/comic-3', 'https://example.com/cover3.jpg', 'Synopsis here.', 0]
      );
    });
  });
});
