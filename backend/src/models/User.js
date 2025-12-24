/**
 * User Model
 * Database operations for users
 */

const { Pool } = require('pg');
const config = require('../config');

// Database connection pool
const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
});

class User {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const {
      id,
      email,
      password_hash,
      name,
      role,
      phone,
      is_active,
      email_verified,
    } = userData;

    const query = `
      INSERT INTO users (id, email, password_hash, name, role, phone, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      id,
      email,
      password_hash,
      name,
      role,
      phone,
      is_active,
      email_verified,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  /**
   * Delete user (soft delete)
   */
  static async delete(id) {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }
}

module.exports = User;

