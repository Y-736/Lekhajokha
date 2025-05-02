const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { loginValidation, statusValidation } = require('../middleware/adminValidation');

router.post('/login', loginValidation, adminController.login);
router.get('/retailers/pending', adminController.getPendingRetailers);
router.put('/retailers/:id/status', statusValidation, adminController.updateRetailerStatus);
router.get('/retailers', adminController.getAllRetailers);

module.exports = router;