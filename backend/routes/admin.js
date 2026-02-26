const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Auth routes
router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/me', adminController.getMe);

module.exports = router;
