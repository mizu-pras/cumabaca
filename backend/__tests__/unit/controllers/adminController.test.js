const jwt = require('jsonwebtoken');
const AdminUser = require('../../../models/AdminUser');

jest.mock('jsonwebtoken');
jest.mock('../../../models/AdminUser');

const adminController = require('../../../controllers/adminController');

describe('adminController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns 400 when username or password missing', async () => {
      req.body = { username: 'admin' }; // no password
      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username and password are required' });
    });

    it('returns 401 for unknown username', async () => {
      req.body = { username: 'unknown', password: 'pass' };
      AdminUser.findByUsername.mockResolvedValue(null);

      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 for wrong password', async () => {
      req.body = { username: 'admin', password: 'wrong' };
      AdminUser.findByUsername.mockResolvedValue({ id: 1, username: 'admin', password_hash: 'hash' });
      AdminUser.verifyPassword.mockReturnValue(false);

      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('sets httpOnly cookie and returns user on success', async () => {
      req.body = { username: 'admin', password: 'correct' };
      const user = { id: 1, username: 'admin', password_hash: 'hash' };
      AdminUser.findByUsername.mockResolvedValue(user);
      AdminUser.verifyPassword.mockReturnValue(true);
      AdminUser.updateLastLogin.mockResolvedValue(undefined);
      AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });
      jwt.sign.mockReturnValue('jwt-token');

      await adminController.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'admin_token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith({ user: { id: 1, username: 'admin' } });
    });
  });

  describe('logout', () => {
    it('clears the admin_token cookie', async () => {
      await adminController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('admin_token');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('getMe', () => {
    it('returns 401 when no token', async () => {
      await adminController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('returns 401 for expired token', async () => {
      req.cookies.admin_token = 'expired';
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw err; });

      await adminController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    });

    it('returns 401 for invalid token', async () => {
      req.cookies.admin_token = 'invalid';
      const err = new Error('invalid');
      err.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw err; });

      await adminController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('returns user data for valid token', async () => {
      req.cookies.admin_token = 'valid';
      jwt.verify.mockReturnValue({ id: 1 });
      const user = { id: 1, username: 'admin', password_hash: 'hash' };
      AdminUser.findById.mockResolvedValue(user);
      AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });

      await adminController.getMe(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: { id: 1, username: 'admin' } });
    });

    it('returns 401 when user not found', async () => {
      req.cookies.admin_token = 'valid';
      jwt.verify.mockReturnValue({ id: 999 });
      AdminUser.findById.mockResolvedValue(null);

      await adminController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});
