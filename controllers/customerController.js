const pool = require('../config/db');

// Add customer
const addCustomer = async (req, res) => {
  try {
    const { shopid, name, mobile, email, address } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO customers (shopid, name, mobile, email, address) VALUES (?, ?, ?, ?, ?)',
      [shopid, name, mobile, email, address]
    );
    
    res.status(201).json({ message: 'Customer added successfully', customerId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all customers for a shop
// controllers/customerController.js
// controllers/customerController.js
const getCustomersByShop = async (req, res) => {
  try {
    // Now using the shopid from authenticated token
    const shopid = req.shopid; // Set by middleware

    const [customers] = await pool.query(
      `SELECT name, mobile, email, address, 
       DATE(registerdate) as registerdate
       FROM customers 
       WHERE shopid = ?`,
      [shopid]
    );

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { shopid, mobile } = req.params;
    const { name, email, address } = req.body;
    
    await pool.query(
      'UPDATE customers SET name = ?, email = ?, address = ? WHERE shopid = ? AND mobile = ?',
      [name, email, address, shopid, mobile]
    );
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { shopid, mobile } = req.params;
    
    await pool.query('DELETE FROM customers WHERE shopid = ? AND mobile = ?', [shopid, mobile]);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addCustomer,
  getCustomersByShop,
  updateCustomer,
  deleteCustomer
};