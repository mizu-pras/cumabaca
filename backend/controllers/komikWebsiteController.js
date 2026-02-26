const KomikWebsite = require('../models/KomikWebsite');
const Komik = require('../models/Komik');
const Website = require('../models/Website');

const komikWebsiteController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const komik_id = req.query.komik_id ? parseInt(req.query.komik_id) : undefined;
      const website_id = req.query.website_id ? parseInt(req.query.website_id) : undefined;

      const filters = { page, limit, komik_id, website_id };
      const data = await KomikWebsite.findAll(filters);

      res.json({ data });
    } catch (error) {
      console.error('Get komik websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      res.json({ data: komikWebsite });
    } catch (error) {
      console.error('Get komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { komik_id, website_id, url, total_chapters } = req.body;

      if (!komik_id || !website_id || !url) {
        return res.status(400).json({ error: 'Komik ID, Website ID, and URL are required' });
      }

      // Verify komik and website exist
      const [komik, website] = await Promise.all([
        Komik.findById(komik_id),
        Website.findById(website_id)
      ]);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      const result = await KomikWebsite.create({
        komik_id, website_id, url, total_chapters
      });

      res.status(201).json({
        data: { id: result.id, komik_id, website_id, url, total_chapters }
      });
    } catch (error) {
      console.error('Create komik website error:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'This komik is already linked to this website' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { url, total_chapters, last_checked_at } = req.body;

      const existing = await KomikWebsite.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      await KomikWebsite.update(id, { url, total_chapters, last_checked_at });
      const updated = await KomikWebsite.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await KomikWebsite.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      await KomikWebsite.delete(id);
      res.json({ message: 'Mapping deleted successfully' });
    } catch (error) {
      console.error('Delete komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = komikWebsiteController;
