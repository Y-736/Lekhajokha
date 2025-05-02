const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { sendApprovalEmail,sendRejectionEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');

// Admin login
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { email, password } = req.body;
    
    // Find admin
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = generateToken({
      id: admin.adminid,
      role: 'admin',
      email: admin.email
    });
    
    // Set secure cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.status(200).json({ 
      success: true,
      token,
      admin: { 
        adminid: admin.adminid, 
        name: admin.name, 
        email: admin.email 
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Get all pending retailers
const getPendingRetailers = async (req, res) => {
  try {
    const [retailers] = await pool.query(`
      SELECT nr.*, r.name, r.address, r.mobile, r.email as retailer_email
      FROM new_retailers nr
      JOIN retailers r ON nr.retailer_id = r.shopid
      WHERE nr.status = 'Pending'
      ORDER BY nr.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: retailers.length,
      data: retailers
    });
  } catch (error) {
    console.error('Error fetching pending retailers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending retailers' 
    });
  }
};

const updateRetailerStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate input against your ENUM values
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Pending, Approved, or Rejected'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update new_retailers table - using correct column names
    const [updateResult] = await connection.query(
      `UPDATE new_retailers 
       SET status = ?, admin_notes = ?
       WHERE id = ?`,
      [status, adminNotes || null, id]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Retailer not found'
      });
    }

    // Get retailer_id for main table update
    const [retailer] = await connection.query(
      'SELECT retailer_id FROM new_retailers WHERE id = ?',
      [id]
    );

    // Update main retailers table (without updated_at)
    await connection.query(
      `UPDATE retailers 
       SET status = ?
       WHERE shopid = ?`,
      [status, retailer[0].retailer_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Retailer status updated to ${status}`
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};



// Get all retailers with pagination
const getAllRetailers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    const [total] = await pool.query('SELECT COUNT(*) as count FROM retailers');
    const totalCount = total[0].count;
    
    // Get paginated results
    const [retailers] = await pool.query(
      `SELECT shopid, name, email, mobile, status, register_date 
       FROM retailers 
       ORDER BY register_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    res.status(200).json({
      success: true,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        limit
      },
      data: retailers
    });
  } catch (error) {
    console.error('Error fetching retailers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retailers'
    });
  }
};

module.exports = {
  login,
  getPendingRetailers,
  updateRetailerStatus,
  getAllRetailers
};