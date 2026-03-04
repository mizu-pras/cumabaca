// Mock scraperClient to prevent health check interval
jest.mock('../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
  getData: jest.fn(),
  isHealthy: jest.fn().mockReturnValue(true),
  startHealthCheck: jest.fn(),
  stopHealthCheck: jest.fn(),
  healthCheckInterval: null,
}));

// Mock MongoDB cache
jest.mock('../../utils/mongodb-cache', () => ({
  get: jest.fn().mockResolvedValue(null),
  put: jest.fn().mockResolvedValue(undefined),
  del: jest.fn(),
  clear: jest.fn(),
  getStats: jest.fn(),
  getCachedComics: jest.fn(),
}));

// Mock database connection
jest.mock('../../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock AdminUser model
jest.mock('../../models/AdminUser', () => ({
  findByUsername: jest.fn(),
  findById: jest.fn(),
  verifyPassword: jest.fn(),
  updateLastLogin: jest.fn(),
  toJSON: jest.fn(),
}));

// Mock Language model for CRUD tests
jest.mock('../../models/Language', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../../app');
const AdminUser = require('../../models/AdminUser');
const Language = require('../../models/Language');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function makeToken(payload = { id: 1, username: 'admin' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('POST /admin/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when credentials missing', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ username: 'admin' }); // no password

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  it('returns 401 for invalid credentials', async () => {
    AdminUser.findByUsername.mockResolvedValue(null);

    const res = await request(app)
      .post('/admin/auth/login')
      .send({ username: 'unknown', password: 'pass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for wrong password', async () => {
    AdminUser.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      password_hash: 'hash',
    });
    AdminUser.verifyPassword.mockReturnValue(false);

    const res = await request(app)
      .post('/admin/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('sets httpOnly cookie and returns user on success', async () => {
    AdminUser.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      password_hash: 'hash',
    });
    AdminUser.verifyPassword.mockReturnValue(true);
    AdminUser.updateLastLogin.mockResolvedValue(undefined);
    AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });

    const res = await request(app)
      .post('/admin/auth/login')
      .send({ username: 'admin', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 1, username: 'admin' });

    // Check httpOnly cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith('admin_token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
  });
});

describe('POST /admin/auth/logout', () => {
  it('clears the admin_token cookie', async () => {
    const res = await request(app).post('/admin/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');

    // Cookie should be cleared (expires in past)
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });
});

describe('GET /admin/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/admin/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('returns user for valid token', async () => {
    const token = makeToken({ id: 1, username: 'admin' });
    AdminUser.findById.mockResolvedValue({
      id: 1,
      username: 'admin',
      password_hash: 'hash',
    });
    AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });

    const res = await request(app)
      .get('/admin/auth/me')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 1, username: 'admin' });
  });

  it('returns 401 for expired token', async () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1s' });

    const res = await request(app)
      .get('/admin/auth/me')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token expired');
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/admin/auth/me')
      .set('Cookie', 'admin_token=invalid-garbage');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });
});

describe('Admin CRUD: /admin/languages', () => {
  let token;

  beforeAll(() => {
    token = makeToken({ id: 1, username: 'admin' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/admin/languages');

    expect(res.status).toBe(401);
  });

  it('GET / returns paginated list', async () => {
    Language.findAll.mockResolvedValue([
      { id: 1, name: 'English', code: 'en' },
    ]);
    Language.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/admin/languages')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /:id returns single language', async () => {
    Language.findById.mockResolvedValue({ id: 1, name: 'English', code: 'en' });

    const res = await request(app)
      .get('/admin/languages/1')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('English');
  });

  it('GET /:id returns 404 when not found', async () => {
    Language.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/admin/languages/999')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(404);
  });

  it('POST / creates a language', async () => {
    Language.create.mockResolvedValue({ id: 2 });

    const res = await request(app)
      .post('/admin/languages')
      .set('Cookie', `admin_token=${token}`)
      .send({ name: 'Japanese', code: 'ja' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Japanese');
  });

  it('POST / returns 400 when name or code missing', async () => {
    const res = await request(app)
      .post('/admin/languages')
      .set('Cookie', `admin_token=${token}`)
      .send({ name: 'Japanese' }); // no code

    expect(res.status).toBe(400);
  });

  it('PUT /:id updates a language', async () => {
    Language.findById
      .mockResolvedValueOnce({ id: 1, name: 'English', code: 'en' }) // exists check
      .mockResolvedValueOnce({ id: 1, name: 'Updated', code: 'en' }); // after update
    Language.update.mockResolvedValue(undefined);

    const res = await request(app)
      .put('/admin/languages/1')
      .set('Cookie', `admin_token=${token}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  it('DELETE /:id soft-deletes a language', async () => {
    Language.findById.mockResolvedValue({ id: 1, name: 'English', code: 'en' });
    Language.softDelete.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/admin/languages/1')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });

  it('DELETE /:id returns 404 when not found', async () => {
    Language.findById.mockResolvedValue(null);

    const res = await request(app)
      .delete('/admin/languages/999')
      .set('Cookie', `admin_token=${token}`);

    expect(res.status).toBe(404);
  });
});
