const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

// Helper function to handle database connections
const withConnection = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    return await callback(connection);
  } finally {
    if (connection) connection.release();
  }
};

// Admin login (working)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [admins] = await pool.query(
      'SELECT * FROM admins WHERE email = ?', 
      [email]
    );
    
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
    
    const token = generateToken({
      id: admin.adminid,
      role: 'admin',
      email: admin.email
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

// Get dashboard stats (fixed)
const getDashboardStats = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Execute all queries in parallel for better performance
    const [totalRetailers, pendingRetailers, approvedRetailers] = await Promise.all([
      connection.query('SELECT COUNT(*) as count FROM retailers'),
      connection.query(`SELECT COUNT(*) as count FROM new_retailers WHERE status = 'Pending'`),
      connection.query(`SELECT COUNT(*) as count FROM new_retailers WHERE status = 'Approved'`)
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRetailers: totalRetailers[0][0].count,
        pendingRetailers: pendingRetailers[0][0].count,
        approvedRetailers: approvedRetailers[0][0].count
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  } finally {
    if (connection) connection.release();
  }
};

// Get pending retailers (fixed)
const getPendingRetailers = async (req, res) => {
  try {
    const retailers = await withConnection(async (connection) => {
      const [rows] = await connection.query(`
        SELECT 
          nr.id,
          nr.retailer_id,
          r.name,
          r.email,
          r.mobile,
          nr.business_name,
          nr.business_type,
          nr.gst_number,
          nr.location,
          nr.aadhar,
          nr.created_at
        FROM new_retailers nr
        JOIN retailers r ON nr.retailer_id = r.shopid
        WHERE nr.status = 'Pending'
        ORDER BY nr.created_at DESC
      `);
      return rows;
    });
    
    res.status(200).json({
      success: true,
      count: retailers.length,
      data: retailers
    });
    
  } catch (error) {
    console.error('Pending retailers error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending retailers' 
    });
  }
};

// Update retailer status (fixed with transaction)
const updateRetailerStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body; // These are the required fields
  let connection;

  // 1. Validate required fields
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status field is required',
      requiredFields: ['status'],
      note: 'Admin notes are optional'
    });
  }

  // 2. Validate status value
  const normalizedStatus = typeof status === 'string' 
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : null;

  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
      received: status,
      validOptions: validStatuses,
      note: 'Status is case-insensitive (e.g., "approved" or "APPROVED" both work)'
    });
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Update status in database
    const [result] = await connection.query(
      `UPDATE new_retailers 
       SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [normalizedStatus, adminNotes || null, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Retailer application not found'
      });
    }

    // 4. If approved, update retailer table
    if (normalizedStatus === 'Approved') {
      await connection.query(
        `UPDATE retailers r
         JOIN new_retailers nr ON r.shopid = nr.retailer_id
         SET r.address = nr.location
         WHERE nr.id = ?`,
        [id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Retailer status updated to ${normalizedStatus}`
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Get all retailers with pagination (fixed)
const getAllRetailers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const results = await withConnection(async (connection) => {
      // Get total count
      const [[{ count }]] = await connection.query(
        'SELECT COUNT(*) as count FROM retailers'
      );
      
      // Get paginated results - CORRECTED QUERY
      const [retailers] = await connection.query(`
        SELECT 
          r.shopid, 
          r.name, 
          r.email, 
          r.mobile,
          r.address,
          r.register_date,
          nr.status,
          nr.business_name,
          nr.business_type
        FROM retailers r
        LEFT JOIN new_retailers nr ON r.shopid = nr.retailer_id
        ORDER BY r.register_date DESC
        LIMIT ? OFFSET ?
      `, [parseInt(limit), parseInt(offset)]);
      
      return { count, retailers };
    });
    
    res.status(200).json({
      success: true,
      pagination: {
        total: results.count,
        page: parseInt(page),
        pages: Math.ceil(results.count / limit),
        limit: parseInt(limit)
      },
      data: results.retailers
    });
    
  } catch (error) {
    console.error('All retailers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retailers'
    });
  }
};

module.exports = {
  login,
  getDashboardStats,
  getPendingRetailers,
  updateRetailerStatus,
  getAllRetailers
};