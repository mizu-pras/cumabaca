const express = require('express');
const router = express.Router();
const chapterScrapeController = require('../../controllers/chapterScrapeController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);
router.post('/sync', chapterScrapeController.syncAll);

module.exports = router;
