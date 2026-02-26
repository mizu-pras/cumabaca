const express = require('express');
const router = express.Router();
const languageController = require('../../controllers/languageController');
const { requireAuth } = require('../../middleware/auth');

// Apply auth to all routes
router.use(requireAuth);

router.get('/', languageController.getAll);
router.get('/:id', languageController.getById);
router.post('/', languageController.create);
router.put('/:id', languageController.update);
router.delete('/:id', languageController.delete);

module.exports = router;
