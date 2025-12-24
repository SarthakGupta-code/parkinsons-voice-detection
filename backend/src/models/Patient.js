/**
 * Patient Model
 * Database operations for patients
 */

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
});

class Patient {
  /**
   * Find patient by ID
   */
  static async findById(id) {
    const query = `
      SELECT p.*, u.name
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new patient
   */
  static async create(patientData) {
    const {
      id,
      user_id,
      age,
      gender,
      village,
      district,
      state,
      assigned_worker_id,
      medical_history,
    } = patientData;

    const query = `
      INSERT INTO patients (
        id, user_id, age, gender, village, district, state,
        assigned_worker_id, medical_history
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      id,
      user_id,
      age,
      gender,
      village,
      district,
      state,
      assigned_worker_id,
      JSON.stringify(medical_history),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all patients with pagination
   */
  static async findAll({ filter = {}, search, limit, offset }) {
    let query = `
      SELECT p.*, u.name
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL
    `;
    const values = [];
    let paramCount = 1;

    // Apply filters
    if (filter.assigned_worker_id) {
      query += ` AND p.assigned_worker_id = $${paramCount}`;
      values.push(filter.assigned_worker_id);
      paramCount++;
    }

    if (filter.user_id) {
      query += ` AND p.user_id = $${paramCount}`;
      values.push(filter.user_id);
      paramCount++;
    }

    // Search
    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR p.village ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Count total
    const countQuery = query.replace('SELECT p.*, u.name', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      patients: result.rows,
      total,
    };
  }

  /**
   * Update patient
   */
  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields
      .map((field, index) => {
        if (field === 'medical_history') {
          return `${field} = $${index + 2}::jsonb`;
        }
        return `${field} = $${index + 2}`;
      })
      .join(', ');

    const query = `
      UPDATE patients
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    // Convert medical_history to JSON if present
    const processedValues = values.map((val) =>
      typeof val === 'object' && val !== null ? JSON.stringify(val) : val
    );

    const result = await pool.query(query, [id, ...processedValues]);
    return result.rows[0];
  }

  /**
   * Soft delete patient
   */
  static async softDelete(id) {
    const query = `
      UPDATE patients
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  /**
   * Get patient assessment history
   */
  static async getHistory(patientId, limit) {
    const query = `
      SELECT 
        ar.id,
        ar.risk_percentage,
        ar.confidence_level,
        ar.analyzed_at,
        r.recording_type,
        r.recorded_at
      FROM analysis_results ar
      JOIN recordings r ON ar.recording_id = r.id
      WHERE r.patient_id = $1
      ORDER BY ar.analyzed_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [patientId, limit]);
    return result.rows;
  }
}

module.exports = Patient;

