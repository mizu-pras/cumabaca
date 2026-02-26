const Website = require('../models/Website');

const websiteController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
      const language_id = req.query.language_id ? parseInt(req.query.language_id) : undefined;

      const filters = { page, limit, search, is_active, language_id };
      const [data, total] = await Promise.all([
        Website.findAll(filters),
        Website.count({ search, is_active, language_id })
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
      console.error('Get websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const website = await Website.findById(id);

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      res.json({ data: website });
    } catch (error) {
      console.error('Get website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { name, url, language_id, use_browser, search_endpoint, is_nsfw } = req.body;

      if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
      }

      const result = await Website.create({
        name, url, language_id, use_browser, search_endpoint, is_nsfw
      });

      res.status(201).json({
        data: { id: result.id, name, url, language_id, use_browser, search_endpoint, is_nsfw }
      });
    } catch (error) {
      console.error('Create website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, url, language_id, use_browser, search_endpoint, is_nsfw, is_active } = req.body;

      const existing = await Website.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Website not found' });
      }

      await Website.update(id, { name, url, language_id, use_browser, search_endpoint, is_nsfw, is_active });
      const updated = await Website.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Website.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Website not found' });
      }

      await Website.softDelete(id);
      res.json({ message: 'Website deleted successfully' });
    } catch (error) {
      console.error('Delete website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = websiteController;
