const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authenticate = require('../middleware/auth');

// Add customer (Retailer only)
router.post('/', authenticate(['retailer']), customerController.addCustomer);

// Get customers for a shop (Retailer only)
router.get('/shop/:shopid', 
  authenticate(['retailer']), 
  customerController.getCustomersByShop
);

// Update customer (Retailer only)
router.put('/:shopid/:mobile', authenticate(['retailer']), customerController.updateCustomer);

// Delete customer (Retailer only)
router.delete('/:shopid/:mobile', authenticate(['retailer']), customerController.deleteCustomer);

module.exports = router;