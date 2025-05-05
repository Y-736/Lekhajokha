const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');

// Admin Login
router.post('/login', adminController.login);  // Make sure adminLogin is exported

// Protected routes
router.get('/dashboard', authenticate(['admin']), adminController.getDashboardStats);
router.get('/retailers/pending', authenticate(['admin']), adminController.getPendingRetailers);
router.put('/retailers/:id/status', authenticate(['admin']), adminController.updateRetailerStatus);
router.get('/retailers', authenticate(['admin']), adminController.getAllRetailers);

module.exports = router;