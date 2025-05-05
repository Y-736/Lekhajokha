const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.retailerSignup = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    
    // Check if email or mobile exists
    const [existing] = await db.query(
      'SELECT * FROM retailers WHERE email = ? OR mobile = ?', 
      [email, mobile]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create retailer
    const [result] = await db.query(
      'INSERT INTO retailers (name, mobile, email, password) VALUES (?, ?, ?, ?)',
      [name, mobile, email, hashedPassword]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Retailer registered successfully. Waiting for approval.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In your authController.js

exports.retailerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [retailer] = await db.query(
      'SELECT * FROM retailers WHERE email = ?', 
      [email]
    );
    
    if (retailer.length === 0) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    
    const isMatch = await bcrypt.compare(password, retailer[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check approval status
    if (retailer[0].status !== 'approved') {
      return res.status(403).json({ 
        message: 'Account pending approval',
        isPending: true  // Add this flag
      });
    }
    
    // Rest of your login logic...
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin
    const [admin] = await db.query(
      'SELECT * FROM admins WHERE email = ?', 
      [email]
    );
    
    if (admin.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, admin[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        id: admin[0].adminid, 
        role: 'admin',
        email: admin[0].email,
        name: admin[0].name
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({ 
      success: true,
      token,
      admin: {
        id: admin[0].adminid,
        name: admin[0].name,
        email: admin[0].email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  NEW: Token Verification Controller
exports.verifyToken = (req, res) => {
  // The authenticate middleware already validated the token and set req.user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not found in token'
    });
  }
  
  res.json({
    success: true,
    valid: true,
    user: req.user  // Contains id, role, email, name from JWT
  });
};