const express = require('express');
const router = express.Router();
const websiteController = require('../../controllers/websiteController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', websiteController.getAll);
router.get('/:id', websiteController.getById);
router.post('/', websiteController.create);
router.put('/:id', websiteController.update);
router.delete('/:id', websiteController.delete);

module.exports = router;
