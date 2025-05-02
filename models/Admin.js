const pool = require('../config/db');

class Admin {
  static async findByEmail(email) {
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    return admins[0];
  }

  static async create({ name, email, password }) {
    const [result] = await pool.query(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return result.insertId;
  }
}

module.exports = Admin;