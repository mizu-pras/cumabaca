// Mock scraperClient to prevent health check interval
jest.mock('../../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
  getData: jest.fn(),
  isHealthy: jest.fn().mockReturnValue(true),
  startHealthCheck: jest.fn(),
  stopHealthCheck: jest.fn(),
  healthCheckInterval: null,
}));

// Mock MongoDB cache
jest.mock('../../../utils/mongodb-cache', () => ({
  get: jest.fn().mockResolvedValue(null),
  put: jest.fn().mockResolvedValue(undefined),
  del: jest.fn(),
  clear: jest.fn(),
  getStats: jest.fn(),
  getCachedComics: jest.fn(),
}));

// Mock database connection
jest.mock('../../../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock AdminUser model
jest.mock('../../../models/AdminUser', () => ({
  findByUsername: jest.fn(),
  findById: jest.fn(),
  verifyPassword: jest.fn(),
  updateLastLogin: jest.fn(),
  toJSON: jest.fn(),
}));

// Mock chapterScrapeController
jest.mock('../../../controllers/chapterScrapeController', () => ({
  scrapeChapters: jest.fn((req, res) => res.json({ data: { komik_website_id: req.params.id, chapters_found: 5, skipped: 0 } })),
  syncAll: jest.fn((req, res) => res.json({ data: { total: 2, success: 2, failed: 0, errors: [] } })),
  getChapters: jest.fn((req, res) => res.json({ data: [] })),
}));

// Mock komikWebsiteController
jest.mock('../../../controllers/komikWebsiteController', () => ({
  getAll: jest.fn((req, res) => res.json({ data: [] })),
  getById: jest.fn((req, res) => res.json({ data: {} })),
  create: jest.fn((req, res) => res.status(201).json({ data: {} })),
  update: jest.fn((req, res) => res.json({ data: {} })),
  delete: jest.fn((req, res) => res.json({ message: 'deleted' })),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../../../app');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function makeToken(payload = { id: 1, username: 'admin' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Admin scrape routes', () => {
  let token;

  beforeAll(() => {
    token = makeToken({ id: 1, username: 'admin' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /admin/komik-websites/:id/scrape-chapters', () => {
    it('returns 200 with scrape result', async () => {
      const res = await request(app)
        .post('/admin/komik-websites/42/scrape-chapters')
        .set('Cookie', `admin_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('komik_website_id', '42');
      expect(res.body.data).toHaveProperty('chapters_found', 5);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/admin/komik-websites/42/scrape-chapters');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /admin/komik-websites/:id/chapters', () => {
    it('returns 200 with chapters list', async () => {
      const res = await request(app)
        .get('/admin/komik-websites/42/chapters')
        .set('Cookie', `admin_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .get('/admin/komik-websites/42/chapters');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /admin/scrape/sync', () => {
    it('returns 200 with sync result', async () => {
      const res = await request(app)
        .post('/admin/scrape/sync')
        .set('Cookie', `admin_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total', 2);
      expect(res.body.data).toHaveProperty('success', 2);
      expect(res.body.data).toHaveProperty('failed', 0);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/admin/scrape/sync');

      expect(res.status).toBe(401);
    });
  });
});
