const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');
const  authenticate  = require('../middleware/auth');

// Public routes
router.post('/signup', retailerController.signup);
router.post('/login', retailerController.login);

// Protected routes
router.post('/complete-profile', authenticate, retailerController.completeProfile);
router.get('/check-status', authenticate, retailerController.checkStatus);

module.exports = router;