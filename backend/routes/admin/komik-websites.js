const express = require('express');
const router = express.Router();
const komikWebsiteController = require('../../controllers/komikWebsiteController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikWebsiteController.getAll);
router.get('/:id', komikWebsiteController.getById);
router.post('/', komikWebsiteController.create);
router.put('/:id', komikWebsiteController.update);
router.delete('/:id', komikWebsiteController.delete);

module.exports = router;
