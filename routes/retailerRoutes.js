const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');

// Retailer signup
router.post('/signup', retailerController.signup);

// Retailer login
router.post('/login', retailerController.login);

// Get retailer profile (Retailer only)
router.get('/profile', retailerController.getProfile);

module.exports = router;