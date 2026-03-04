const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken');

const { requireAuth } = require('../../../middleware/auth');

describe('requireAuth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when no token in cookies', () => {
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with "Token expired" for expired token', () => {
    req.cookies.admin_token = 'expired-token';
    const tokenError = new Error('jwt expired');
    tokenError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw tokenError; });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
  });

  it('returns 401 with "Invalid token" for malformed token', () => {
    req.cookies.admin_token = 'invalid-token';
    const tokenError = new Error('invalid token');
    tokenError.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw tokenError; });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('sets req.user and calls next() for valid token', () => {
    req.cookies.admin_token = 'valid-token';
    jwt.verify.mockReturnValue({ id: 1, username: 'admin', iat: 123, exp: 456 });

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: 1, username: 'admin', iat: 123, exp: 456 });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
