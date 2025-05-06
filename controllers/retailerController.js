const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

// Retailer basic signup
const signup = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    
    // Check if retailer exists
    const [existing] = await pool.query(
      'SELECT * FROM retailers WHERE email = ? OR mobile = ?', 
      [email, mobile]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Retailer already exists' });
    }

    // Hash password and create basic account
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO retailers (name, mobile, email, password) VALUES (?, ?, ?, ?)',
      [name, mobile, email, hashedPassword]
    );

    // Generate token for immediate login
    const token = generateToken({
      id: result.insertId,
      role: 'retailer',
      email: email,
      profileComplete: false
    });
    
    res.status(201).json({ 
      token,
      message: 'Account created successfully. Please complete your business profile.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete business profile
const completeProfile = async (req, res) => {
  try {
    const { shopid } = req.user;
    const { business_name, address, aadhar, business_type, gst_number } = req.body;

    // Get basic info from retailers table
    const [retailer] = await pool.query(
      'SELECT name, mobile, email FROM retailers WHERE shopid = ?',
      [shopid]
    );

    if (retailer.length === 0) {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    // Create business profile
    await pool.query(
      `INSERT INTO new_retailers 
      (retailer_id, business_name, location, mobile, email, aadhar, business_type, gst_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopid,
        business_name || retailer[0].name,
        address,
        retailer[0].mobile,
        retailer[0].email,
        aadhar,
        business_type,
        gst_number
      ]
    );

    res.json({ 
      message: 'Business profile submitted for admin approval',
      profileComplete: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retailer login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [retailers] = await pool.query(
      'SELECT * FROM retailers WHERE email = ?', 
      [email]
    );
    
    if (retailers.length === 0) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    
    const retailer = retailers[0];
    const isMatch = await bcrypt.compare(password, retailer.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check business profile status
    const [businessProfile] = await pool.query(
      'SELECT status FROM new_retailers WHERE retailer_id = ?',
      [retailer.shopid]
    );

    const token = generateToken({
      id: retailer.shopid,
      role: 'retailer',
      email: retailer.email,
      profileComplete: businessProfile.length > 0,
      isApproved: businessProfile.length > 0 && businessProfile[0].status === 'Approved'
    });
    
    res.json({ 
      token,
      retailer: {
        shopid: retailer.shopid,
        name: retailer.name,
        email: retailer.email,
        profileComplete: businessProfile.length > 0,
        isApproved: businessProfile.length > 0 && businessProfile[0].status === 'Approved'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check profile status
const checkStatus = async (req, res) => {
  try {
    const { shopid } = req.user;

    const [profile] = await pool.query(
      'SELECT status FROM new_retailers WHERE retailer_id = ?',
      [shopid]
    );

    if (profile.length === 0) {
      return res.json({ profileComplete: false });
    }

    res.json({
      profileComplete: true,
      isApproved: profile[0].status === 'Approved',
      status: profile[0].status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  completeProfile,
  checkStatus
};