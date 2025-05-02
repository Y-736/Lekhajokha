const pool = require('../config/db');

class NewRetailer {
  static async create({ retailer_id, business_name, location, mobile, email, aadhar, business_type }) {
    const [result] = await pool.query(
      'INSERT INTO new_retailers (retailer_id, business_name, location, mobile, email, aadhar, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [retailer_id, business_name, location, mobile, email, aadhar, business_type]
    );
    return result.insertId;
  }

  static async findPending() {
    const [retailers] = await pool.query(`
      SELECT nr.*, r.name, r.address 
      FROM new_retailers nr
      JOIN retailers r ON nr.retailer_id = r.shopid
      WHERE nr.status = 'pending'
    `);
    return retailers;
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE new_retailers SET status = ? WHERE id = ?', [status, id]);
    return true;
  }
}

module.exports = NewRetailer;