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

// Mock publicKomikController
const mockListKomiks = jest.fn((req, res) => res.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } }));
const mockGetChapters = jest.fn((req, res) => res.json({ data: [] }));
const mockGetPages = jest.fn((req, res) => res.json({ data: [] }));

jest.mock('../../../controllers/publicKomikController', () => ({
  listKomiks: mockListKomiks,
  getChapters: mockGetChapters,
  getPages: mockGetPages,
}));

const request = require('supertest');
const { app } = require('../../../app');

describe('Public API routes (/api/komik)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/komik', () => {
    it('calls listKomiks controller', async () => {
      const res = await request(app).get('/api/komik');

      expect(res.status).toBe(200);
      expect(mockListKomiks).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/komik/:id/chapters', () => {
    it('calls getChapters controller', async () => {
      const res = await request(app).get('/api/komik/42/chapters');

      expect(res.status).toBe(200);
      expect(mockGetChapters).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveProperty('data');
    });

    it('passes id param correctly', async () => {
      await request(app).get('/api/komik/99/chapters');

      expect(mockGetChapters).toHaveBeenCalledTimes(1);
      const req = mockGetChapters.mock.calls[0][0];
      expect(req.params.id).toBe('99');
    });
  });

  describe('GET /api/komik/:komikId/chapters/:chapterId/pages', () => {
    it('calls getPages controller', async () => {
      const res = await request(app).get('/api/komik/1/chapters/5/pages');

      expect(res.status).toBe(200);
      expect(mockGetPages).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveProperty('data');
    });

    it('passes komikId and chapterId params correctly', async () => {
      await request(app).get('/api/komik/10/chapters/20/pages');

      expect(mockGetPages).toHaveBeenCalledTimes(1);
      const req = mockGetPages.mock.calls[0][0];
      expect(req.params.komikId).toBe('10');
      expect(req.params.chapterId).toBe('20');
    });
  });
});
