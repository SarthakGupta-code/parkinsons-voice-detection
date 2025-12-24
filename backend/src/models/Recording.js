/**
 * Recording Model
 * Database operations for recordings
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

class Recording {
  /**
   * Find recording by ID
   */
  static async findById(id) {
    const query = `
      SELECT r.*, p.age as patient_age, p.gender as patient_gender
      FROM recordings r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new recording
   */
  static async create(recordingData) {
    const {
      id,
      patient_id,
      healthcare_worker_id,
      recording_type,
      file_url,
      file_size_bytes,
      duration_seconds,
      quality_score,
      analysis_job_id,
    } = recordingData;

    const query = `
      INSERT INTO recordings (
        id, patient_id, healthcare_worker_id, recording_type,
        file_url, file_size_bytes, duration_seconds, quality_score, analysis_job_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      id,
      patient_id,
      healthcare_worker_id,
      recording_type,
      file_url,
      file_size_bytes,
      duration_seconds,
      quality_score,
      analysis_job_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all recordings with pagination
   */
  static async findAll({ patient_id, limit, offset }) {
    let query = `
      SELECT r.*, p.age as patient_age
      FROM recordings r
      JOIN patients p ON r.patient_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (patient_id) {
      query += ` AND r.patient_id = $${paramCount}`;
      values.push(patient_id);
      paramCount++;
    }

    // Count total
    const countQuery = query.replace('SELECT r.*, p.age as patient_age', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY r.recorded_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      recordings: result.rows,
      total,
    };
  }

  /**
   * Update recording
   */
  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE recordings
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Delete recording
   */
  static async delete(id) {
    const query = 'DELETE FROM recordings WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Recording;

