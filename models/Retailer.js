const pool = require('../config/db');

class Retailer {
  static async findByEmail(email) {
    const [retailers] = await pool.query('SELECT * FROM retailers WHERE email = ?', [email]);
    return retailers[0];
  }

  static async findByMobile(mobile) {
    const [retailers] = await pool.query('SELECT * FROM retailers WHERE mobile = ?', [mobile]);
    return retailers[0];
  }

  static async create({ name, address, mobile, email, password }) {
    const [result] = await pool.query(
      'INSERT INTO retailers (name, address, mobile, email, password) VALUES (?, ?, ?, ?, ?)',
      [name, address, mobile, email, password]
    );
    return result.insertId;
  }

  static async findById(shopid) {
    const [retailers] = await pool.query('SELECT * FROM retailers WHERE shopid = ?', [shopid]);
    return retailers[0];
  }

  static async updateStatus(shopid, status) {
    await pool.query('UPDATE retailers SET status = ? WHERE shopid = ?', [status, shopid]);
    return true;
  }

  static async findAll() {
    const [retailers] = await pool.query('SELECT * FROM retailers');
    return retailers;
  }
}

module.exports = Retailer;