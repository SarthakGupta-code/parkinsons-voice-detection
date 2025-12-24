/**
 * Analysis Result Model
 * Database operations for analysis results
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

class AnalysisResult {
  /**
   * Find by recording ID
   */
  static async findByRecordingId(recordingId) {
    const query = 'SELECT * FROM analysis_results WHERE recording_id = $1 ORDER BY analyzed_at DESC LIMIT 1';
    const result = await pool.query(query, [recordingId]);
    return result.rows[0] || null;
  }

  /**
   * Find by job ID
   */
  static async findByJobId(jobId) {
    // In production, job_id would be stored in recordings table
    // For now, placeholder
    return null;
  }

  /**
   * Create analysis result
   */
  static async create(resultData) {
    const {
      id,
      recording_id,
      risk_percentage,
      confidence_level,
      biomarkers,
      shap_values,
      model_version,
    } = resultData;

    const query = `
      INSERT INTO analysis_results (
        id, recording_id, risk_percentage, confidence_level,
        biomarkers, shap_values, model_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id,
      recording_id,
      risk_percentage,
      confidence_level,
      JSON.stringify(biomarkers),
      JSON.stringify(shap_values),
      model_version,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = AnalysisResult;

