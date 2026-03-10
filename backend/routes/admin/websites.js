const express = require('express');
const router = express.Router();
const websiteController = require('../../controllers/websiteController');
const comicSyncController = require('../../controllers/comicSyncController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', websiteController.getAll);
router.get('/:id', websiteController.getById);
router.post('/', websiteController.create);
router.put('/:id', websiteController.update);
router.delete('/:id', websiteController.delete);

// Comic sync
router.post('/:id/sync-comics', comicSyncController.syncComics);

module.exports = router;
