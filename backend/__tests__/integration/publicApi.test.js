const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Use temp DB
const tmpDbPath = path.join(__dirname, '../../data/test-public-api.db');
process.env.SQLITE_PATH = tmpDbPath;

// Clean up any existing test DB
if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

// Reset sqlite module cache so it picks up the new SQLITE_PATH
delete require.cache[require.resolve('../../config/sqlite')];

const sqlite = require('../../config/sqlite');
const apiRouter = require('../../routes/api');

// Mock scraperClient for lazy page loading
jest.mock('../../middleware/scraperClient', () => ({
  getData: jest.fn().mockResolvedValue({
    data: {
      title: 'Ch 1',
      data: ['https://img.com/1.jpg', 'https://img.com/2.jpg', 'https://img.com/3.jpg'],
    },
  }),
  getChapters: jest.fn(),
  isHealthy: jest.fn().mockReturnValue(true),
  healthCheck: jest.fn(),
  startHealthCheck: jest.fn(),
  stopHealthCheck: jest.fn(),
}));

const scraperClient = require('../../middleware/scraperClient');

let app;

beforeAll(async () => {
  const db = await sqlite.getDb();

  // Seed data
  db.run("INSERT INTO languages (name, code) VALUES ('Indonesian', 'id')");
  db.run("INSERT INTO websites (name, url, language_id) VALUES ('Komiku', 'https://komiku.org', 1)");
  db.run("INSERT INTO komiks (title, synopsis, language_id, cover_image, status) VALUES ('Test Manga', 'A great manga', 1, 'https://cover.jpg', 'ongoing')");
  db.run("INSERT INTO komiks (title, synopsis, language_id, cover_image, status) VALUES ('Another Manga', NULL, 1, NULL, 'completed')");
  db.run("INSERT INTO komik_websites (komik_id, website_id, url, cover, synopsis) VALUES (1, 1, 'https://komiku.org/test-manga/', NULL, NULL)");
  db.run("INSERT INTO komik_websites (komik_id, website_id, url, cover, synopsis) VALUES (2, 1, 'https://komiku.org/another-manga/', 'https://source-cover.jpg', 'Source synopsis')");
  db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (1, 1, 'https://komiku.org/test-manga/ch-1/')");
  db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (1, 2, 'https://komiku.org/test-manga/ch-2/')");
  db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (1, 10.5, 'https://komiku.org/test-manga/ch-10-5/')");
  db.run("INSERT INTO chapters (komik_website_id, chapter_number, url) VALUES (2, 5, 'https://komiku.org/another-manga/ch-5/')");
  sqlite.save();

  app = express();
  app.use(express.json());
  app.use('/api/komik', apiRouter);
});

afterAll(() => {
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

describe('Public Komik API', () => {
  describe('GET /api/komik', () => {
    it('returns all komiks with pagination and source info', async () => {
      const res = await request(app).get('/api/komik');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
      });

      // Results ordered by id DESC, so Another Manga (id=2) first
      const anotherManga = res.body.data.find(k => k.title === 'Another Manga');
      const testManga = res.body.data.find(k => k.title === 'Test Manga');

      // Test Manga: has cover_image directly, source has latest_chapter=10.5
      expect(testManga.cover_image).toBe('https://cover.jpg');
      expect(testManga.source).toBeTruthy();
      expect(testManga.source.latest_chapter).toBe(10.5);

      // Another Manga: no cover_image/synopsis, falls back to source
      expect(anotherManga.cover_image).toBe('https://source-cover.jpg');
      expect(anotherManga.synopsis).toBe('Source synopsis');
    });

    it('filters by search term', async () => {
      const res = await request(app).get('/api/komik?search=test');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Test Manga');
    });

    it('returns empty data for non-matching search', async () => {
      const res = await request(app).get('/api/komik?search=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('filters by status', async () => {
      const res = await request(app).get('/api/komik?status=completed');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Another Manga');
    });

    it('paginates results', async () => {
      const res = await request(app).get('/api/komik?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
      });
    });
  });

  describe('GET /api/komik/:id/chapters', () => {
    it('returns chapters in descending order', async () => {
      const res = await request(app).get('/api/komik/1/chapters');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      // Descending order: 10.5, 2, 1
      expect(res.body.data[0].chapter_number).toBe(10.5);
      expect(res.body.data[1].chapter_number).toBe(2);
      expect(res.body.data[2].chapter_number).toBe(1);
    });

    it('returns 404 for non-existent komik', async () => {
      const res = await request(app).get('/api/komik/999/chapters');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/komik/:komikId/chapters/:chapterId/pages', () => {
    it('lazy loads pages from scraper on first request', async () => {
      const res = await request(app).get('/api/komik/1/chapters/1/pages');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].page_number).toBe(1);
      expect(res.body.data[0].image_url).toBe('https://img.com/1.jpg');
      expect(res.body.data[1].page_number).toBe(2);
      expect(res.body.data[2].page_number).toBe(3);

      // scraperClient.getData should have been called exactly once
      expect(scraperClient.getData).toHaveBeenCalledTimes(1);
    });

    it('returns cached pages on second request without calling scraper', async () => {
      // Reset the mock call count (but keep the mock implementation)
      scraperClient.getData.mockClear();

      const res = await request(app).get('/api/komik/1/chapters/1/pages');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      // scraperClient should NOT be called again — pages are cached in SQLite
      expect(scraperClient.getData).not.toHaveBeenCalled();
    });

    it('returns 404 for non-existent chapter', async () => {
      const res = await request(app).get('/api/komik/1/chapters/999/pages');

      expect(res.status).toBe(404);
    });
  });
});
