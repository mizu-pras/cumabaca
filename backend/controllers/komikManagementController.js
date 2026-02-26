const Komik = require('../models/Komik');
const KomikWebsite = require('../models/KomikWebsite');

const komikManagementController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
      const language_id = req.query.language_id ? parseInt(req.query.language_id) : undefined;
      const status = req.query.status;

      const filters = { page, limit, search, is_active, language_id, status };
      const [data, total] = await Promise.all([
        Komik.findAll(filters),
        Komik.count({ search, is_active, language_id, status })
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
      console.error('Get komiks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const komik = await Komik.findById(id);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      res.json({ data: komik });
    } catch (error) {
      console.error('Get komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getWebsites(req, res) {
    try {
      const { id } = req.params;
      const komik = await Komik.findById(id);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      const websites = await KomikWebsite.findAll({ komik_id: id });
      res.json({ data: websites });
    } catch (error) {
      console.error('Get komik websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { title, synopsis, language_id, cover_image, status } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await Komik.create({
        title, synopsis, language_id, cover_image, status
      });

      res.status(201).json({
        data: { id: result.id, title, synopsis, language_id, cover_image, status }
      });
    } catch (error) {
      console.error('Create komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, synopsis, language_id, cover_image, status, is_active } = req.body;

      const existing = await Komik.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      await Komik.update(id, { title, synopsis, language_id, cover_image, status, is_active });
      const updated = await Komik.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Komik.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      await Komik.softDelete(id);
      res.json({ message: 'Komik deleted successfully' });
    } catch (error) {
      console.error('Delete komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = komikManagementController;
