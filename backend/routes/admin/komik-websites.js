const express = require('express');
const router = express.Router();
const komikWebsiteController = require('../../controllers/komikWebsiteController');
const chapterScrapeController = require('../../controllers/chapterScrapeController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikWebsiteController.getAll);
router.get('/:id', komikWebsiteController.getById);
router.post('/', komikWebsiteController.create);
router.put('/:id', komikWebsiteController.update);
router.delete('/:id', komikWebsiteController.delete);
router.post('/:id/scrape-chapters', chapterScrapeController.scrapeChapters);
router.get('/:id/chapters', chapterScrapeController.getChapters);

module.exports = router;
