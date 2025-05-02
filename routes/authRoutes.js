const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Retailer Signup
router.post('/retailer/signup', authController.retailerSignup);

// Retailer Login
router.post('/retailer/login', authController.retailerLogin);

// Admin Login
router.post('/admin/login', authController.adminLogin);

// Token Verification - NEW ENDPOINT
router.get('/verify', authenticate(['admin', 'retailer']), authController.verifyToken);

module.exports = router;