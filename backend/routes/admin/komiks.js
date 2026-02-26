const express = require('express');
const router = express.Router();
const komikManagementController = require('../../controllers/komikManagementController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikManagementController.getAll);
router.get('/:id', komikManagementController.getById);
router.get('/:id/websites', komikManagementController.getWebsites);
router.post('/', komikManagementController.create);
router.put('/:id', komikManagementController.update);
router.delete('/:id', komikManagementController.delete);

module.exports = router;
