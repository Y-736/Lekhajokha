const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticate = require('../middleware/auth');

// Add transaction (Retailer only)
router.post('/', authenticate(['retailer']), transactionController.addTransaction);

// Get transactions for a shop (Retailer only)
router.get('/shop/:shopid', authenticate(['retailer']), transactionController.getTransactionsByShop);

// Update transaction (Retailer only)
router.put('/:id', authenticate(['retailer']), transactionController.updateTransaction);

// Delete transaction (Retailer only)
router.delete('/:id', authenticate(['retailer']), transactionController.deleteTransaction);

// Generate transaction PDF (Retailer only)


router.get(
  '/transactions/:transaction_id/pdf',
  authenticate(['retailer', 'admin']),
  transactionController.generateTransactionPDF
);



// Get dashboard stats (Retailer only)
router.get('/dashboard/:shopid', authenticate(['retailer']), transactionController.getDashboardStats);

module.exports = router;