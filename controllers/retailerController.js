const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

// Retailer signup
const signup = async (req, res) => {
  try {
    const { name, address, mobile, email, password } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM retailers WHERE email = ? OR mobile = ?', [email, mobile]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Retailer already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO retailers (name, address, mobile, email, password) VALUES (?, ?, ?, ?, ?)',
      [name, address, mobile, email, hashedPassword]
    );

    await pool.query(
      'INSERT INTO new_retailers (retailer_id, business_name, location, mobile, email, aadhar, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [result.insertId, name, address, mobile, email, req.body.aadhar, req.body.business_type]
    );

    res.status(201).json({ message: 'Retailer registered successfully. Waiting for approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retailer login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [retailers] = await pool.query('SELECT * FROM retailers WHERE email = ?', [email]);
    if (retailers.length === 0) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    
    const retailer = retailers[0];
    
    if (retailer.status !== 'Approved') {
      return res.status(403).json({ message: 'Your account is not approved yet' });
    }
    
    const isMatch = await bcrypt.compare(password, retailer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken({
      id: retailer.shopid,
      role: 'retailer',
      email: retailer.email
    });
    
    res.json({ token, retailer: { shopid: retailer.shopid, name: retailer.name, email: retailer.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get retailer profile
const getProfile = async (req, res) => {
  try {
    const { shopid } = req.user;
    
    const [retailers] = await pool.query('SELECT * FROM retailers WHERE shopid = ?', [shopid]);
    if (retailers.length === 0) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    
    res.json(retailers[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  getProfile
};