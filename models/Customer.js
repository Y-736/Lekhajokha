const pool = require('../config/db');

class Customer {
  static async create({ shopid, name, mobile, email, address }) {
    const [result] = await pool.query(
      'INSERT INTO customers (shopid, name, mobile, email, address) VALUES (?, ?, ?, ?, ?)',
      [shopid, name, mobile, email, address]
    );
    return result.insertId;
  }

  static async findByShop(shopid) {
    const [customers] = await pool.query('SELECT * FROM customers WHERE shopid = ?', [shopid]);
    return customers;
  }

  static async update({ shopid, mobile, name, email, address }) {
    await pool.query(
      'UPDATE customers SET name = ?, email = ?, address = ? WHERE shopid = ? AND mobile = ?',
      [name, email, address, shopid, mobile]
    );
    return true;
  }

  static async delete({ shopid, mobile }) {
    await pool.query('DELETE FROM customers WHERE shopid = ? AND mobile = ?', [shopid, mobile]);
    return true;
  }
}

module.exports = Customer;