const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '24h';

const adminController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = AdminUser.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = AdminUser.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      AdminUser.updateLastLogin(user.id);

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Set httpOnly cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        user: AdminUser.toJSON(user)
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async logout(req, res) {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out successfully' });
  },

  async getMe(req, res) {
    try {
      const token = req.cookies.admin_token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = AdminUser.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({ user: AdminUser.toJSON(user) });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = adminController;
