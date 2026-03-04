// Mock scraperClient singleton before app.js loads it
jest.mock('../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
  getData: jest.fn(),
  isHealthy: jest.fn().mockReturnValue(true),
  startHealthCheck: jest.fn(),
  stopHealthCheck: jest.fn(),
  healthCheckInterval: null,
}));

// Mock MongoDB cache to avoid needing a real database
jest.mock('../../utils/mongodb-cache', () => ({
  get: jest.fn().mockResolvedValue(null), // always cache miss
  put: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0 }),
  getCachedComics: jest.fn().mockResolvedValue([]),
}));

// Mock database connection
jest.mock('../../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const { app } = require('../../app');
const scraperClient = require('../../middleware/scraperClient');
const mongoCache = require('../../utils/mongodb-cache');

describe('GET /komik/chapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoCache.get.mockResolvedValue(null);
  });

  it('returns 400 when url parameter is missing', async () => {
    const res = await request(app).get('/komik/chapters');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('URL parameter is required');
  });

  it('returns 400 for unsupported domain', async () => {
    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://unsupported.com/manga/test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Unsupported website URL');
  });

  it('returns 403 for NSFW site without secret mode', async () => {
    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://sektedoujin.cc/manga/test' });

    expect(res.status).toBe(403);
    expect(res.body.nsfw).toBe(true);
  });

  it('returns chapter data for supported URL', async () => {
    scraperClient.getChapters.mockResolvedValue({
      data: [{ chapter: 'Ch 1', url: '/ch-1' }],
    });

    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://komiku.org/manga/test' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ chapter: 'Ch 1', url: '/ch-1' }]);
  });

  it('allows NSFW site with mode=secret', async () => {
    scraperClient.getChapters.mockResolvedValue({
      data: [{ chapter: 'Ch 1' }],
    });

    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://sektedoujin.cc/manga/test', mode: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 404 for empty results', async () => {
    scraperClient.getChapters.mockResolvedValue({ data: [] });

    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://komiku.org/manga/empty' });

    expect(res.status).toBe(404);
  });

  it('returns 504 when scraper is unavailable', async () => {
    scraperClient.getChapters.mockRejectedValue(
      new Error('Scraper service unavailable')
    );

    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://komiku.org/manga/test' });

    expect(res.status).toBe(504);
    expect(res.body.error).toContain('Scraper service unavailable');
  });

  it('returns cached response on cache hit', async () => {
    const cached = JSON.stringify({ data: [{ chapter: 'Cached Ch' }] });
    mongoCache.get.mockResolvedValue(cached);

    const res = await request(app)
      .get('/komik/chapters')
      .query({ url: 'https://komiku.org/manga/test' });

    expect(res.status).toBe(200);
    // scraperClient should NOT be called on cache hit
    expect(scraperClient.getChapters).not.toHaveBeenCalled();
  });
});

describe('GET /komik/data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoCache.get.mockResolvedValue(null);
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app).get('/komik/data');

    expect(res.status).toBe(400);
  });

  it('returns unwrapped chapter data', async () => {
    scraperClient.getData.mockResolvedValue({
      data: { title: 'Chapter 1', data: ['img1.jpg', 'img2.jpg'] },
    });

    const res = await request(app)
      .get('/komik/data')
      .query({ url: 'https://komiku.org/ch-1/' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Chapter 1');
    expect(res.body.data).toEqual(['img1.jpg', 'img2.jpg']);
  });

  it('returns 403 for NSFW chapter without secret mode', async () => {
    const res = await request(app)
      .get('/komik/data')
      .query({ url: 'https://sektedoujin.cc/ch-1/' });

    expect(res.status).toBe(403);
  });
});

describe('GET /health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 when scraper is healthy', async () => {
    scraperClient.isHealthy.mockReturnValue(true);

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 503 when scraper is unhealthy', async () => {
    scraperClient.isHealthy.mockReturnValue(false);

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
  });
});
