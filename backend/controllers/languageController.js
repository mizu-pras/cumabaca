const Language = require('../models/Language');

const languageController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;

      const filters = { page, limit, search, is_active };
      const [data, total] = await Promise.all([
        Language.findAll(filters),
        Language.count({ search, is_active })
      ]);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const language = await Language.findById(id);

      if (!language) {
        return res.status(404).json({ error: 'Language not found' });
      }

      res.json({ data: language });
    } catch (error) {
      console.error('Get language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
      }

      const result = await Language.create({ name, code });
      res.status(201).json({ data: { id: result.id, name, code } });
    } catch (error) {
      console.error('Create language error:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Language code already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, code, is_active } = req.body;

      const existing = await Language.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      await Language.update(id, { name, code, is_active });
      const updated = await Language.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Language.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      await Language.softDelete(id);
      res.json({ message: 'Language deleted successfully' });
    } catch (error) {
      console.error('Delete language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = languageController;
