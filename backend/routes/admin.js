const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Auth routes (no auth required for login)
router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/me', adminController.getMe);

// Management routes (authenticated)
router.use('/languages', require('./admin/languages'));
router.use('/websites', require('./admin/websites'));
router.use('/komiks', require('./admin/komiks'));
router.use('/komik-websites', require('./admin/komik-websites'));
router.use('/scrape', require('./admin/scrape'));

module.exports = router;
