const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const publicKomikController = require('../controllers/publicKomikController');

router.get('/', asyncHandler(publicKomikController.listKomiks));
router.get('/:id/chapters', asyncHandler(publicKomikController.getChapters));
router.get('/:komikId/chapters/:chapterId/pages', asyncHandler(publicKomikController.getPages));

module.exports = router;
