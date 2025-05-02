const pool = require('../config/db');

class Transaction {
  static async create({ shopid, mobile, amount, credit_debit, type, details }) {
    const [result] = await pool.query(
      'INSERT INTO transactions (shopid, mobile, amount, credit_debit, type, details) VALUES (?, ?, ?, ?, ?, ?)',
      [shopid, mobile, amount, credit_debit, type, details]
    );
    return result.insertId;
  }

  static async findByShop(shopid, filters = {}) {
    let query = 'SELECT * FROM transactions WHERE shopid = ?';
    const params = [shopid];
    
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.startDate && filters.endDate) {
      query += ' AND datetime BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }
    
    const [transactions] = await pool.query(query, params);
    return transactions;
  }

  static async findById(transaction_id) {
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE transaction_id = ?', [transaction_id]);
    return transactions[0];
  }

  static async update(transaction_id, { amount, credit_debit, type, status, details }) {
    await pool.query(
      'UPDATE transactions SET amount = ?, credit_debit = ?, type = ?, status = ?, details = ? WHERE transaction_id = ?',
      [amount, credit_debit, type, status, details, transaction_id]
    );
    return true;
  }

  static async delete(transaction_id) {
    await pool.query('DELETE FROM transactions WHERE transaction_id = ?', [transaction_id]);
    return true;
  }

  static async getDashboardStats(shopid) {
    const [creditResult] = await pool.query(
      'SELECT SUM(amount) as totalCredit FROM transactions WHERE shopid = ? AND credit_debit = "credit"',
      [shopid]
    );
    
    const [debitResult] = await pool.query(
      'SELECT SUM(amount) as totalDebit FROM transactions WHERE shopid = ? AND credit_debit = "debit"',
      [shopid]
    );
    
    const [recentTransactions] = await pool.query(
      'SELECT * FROM transactions WHERE shopid = ? ORDER BY datetime DESC LIMIT 5',
      [shopid]
    );
    
    return {
      totalCredit: creditResult[0].totalCredit || 0,
      totalDebit: debitResult[0].totalDebit || 0,
      recentTransactions
    };
  }
}

module.exports = Transaction;