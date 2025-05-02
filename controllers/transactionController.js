const pool = require('../config/db');
const {generatePDF} = require('../services/pdfService');


// Add transaction
const addTransaction = async (req, res) => {
  try {
    const { shopid, mobile, amount, credit_debit, type, details } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO transactions (shopid, mobile, amount, credit_debit, type, details) VALUES (?, ?, ?, ?, ?, ?)',
      [shopid, mobile, amount, credit_debit, type, details]
    );
    
    res.status(201).json({ message: 'Transaction added successfully', transactionId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transactions for a shop
const getTransactionsByShop = async (req, res) => {
  try {
    const { shopid } = req.params;
    const { type, status, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE shopid = ?';
    const params = [shopid];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (startDate && endDate) {
      query += ' AND datetime BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    const [transactions] = await pool.query(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, credit_debit, type, status, details } = req.body;

    // Validate status (example: allowed values are 'pending', 'completed', 'cancelled')
    const allowedStatuses = ['pending', 'completed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value. Allowed values: pending, completed, cancelled" 
      });
    }

    await pool.query(
      'UPDATE transactions SET amount = ?, credit_debit = ?, type = ?, status = ?, details = ? WHERE transaction_id = ?',
      [amount, credit_debit, type, status, details, id]
    );
    
    res.json({ 
      success: true,
      message: 'Transaction updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM transactions WHERE transaction_id = ?', [id]);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate transaction PDF
const generateTransactionPDF = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    // 1. Validate transaction ID
    if (!/^\d+$/.test(transaction_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    // 2. Fetch transaction
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE transaction_id = ?',
      [transaction_id]
    );

    if (!transactions.length) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // 3. Generate PDF
    const pdfBytes = await generatePDF(transactions[0]);

    // 4. Send response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receipt-${transaction_id}.pdf`
    });
    res.send(pdfBytes);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'PDF generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const { shopid } = req.params;

    // Validate shop ID
    if (!/^\d+$/.test(shopid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID'
      });
    }

    // Get stats for last 30 days
    const [results] = await pool.query(`
      SELECT 
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_revenue,
        AVG(amount) AS average_order_value,
        SUM(CASE WHEN type = 'sale' THEN 1 ELSE 0 END) AS total_sales,
        SUM(CASE WHEN type = 'refund' THEN 1 ELSE 0 END) AS total_refunds
      FROM transactions
      WHERE shopid = ?
        AND datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [shopid]);

    // Get daily sales for chart
    const [dailyData] = await pool.query(`
      SELECT 
        DATE(datetime) AS date,
        SUM(amount) AS daily_revenue,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE shopid = ?
        AND datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(datetime)
      ORDER BY date ASC
    `, [shopid]);

    res.json({
      success: true,
      data: {
        summary: results[0],
        dailyTrends: dailyData
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

module.exports = {
  addTransaction,
  getTransactionsByShop,
  updateTransaction,
  deleteTransaction,
  generateTransactionPDF,
  getDashboardStats
};