/**
 * Analysis Controller
 * Handles analysis job queue and results retrieval
 */

const axios = require('axios');
const AnalysisResult = require('../models/AnalysisResult');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Queue analysis job
 */
const queueAnalysis = async (req, res) => {
  try {
    const { recording_id } = req.body;

    // Get recording details
    const Recording = require('../models/Recording');
    const recording = await Recording.findById(recording_id);

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Recording not found',
        },
      });
    }

    // Call ML service
    const mlResponse = await axios.post(`${config.ML_SERVICE_URL}/api/ml/analyze`, {
      audio_file_url: recording.file_url,
      patient_id: recording.patient_id,
      recording_type: recording.recording_type,
    });

    const { job_id, status } = mlResponse.data;

    // Update recording
    await Recording.update(recording_id, {
      analysis_job_id: job_id,
    });

    res.json({
      success: true,
      data: {
        job_id,
        status,
        estimated_time: 45, // seconds
      },
    });
  } catch (error) {
    logger.error(`Queue analysis error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to queue analysis',
      },
    });
  }
};

/**
 * Get analysis job status
 */
const getJobStatus = async (req, res) => {
  try {
    const { job_id } = req.params;

    // In production, check Redis/Bull queue
    // For now, check if results exist
    const result = await AnalysisResult.findByJobId(job_id);

    if (result) {
      return res.json({
        success: true,
        data: {
          job_id,
          status: 'completed',
          results: {
            risk_percentage: result.risk_percentage,
            confidence_level: result.confidence_level,
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        job_id,
        status: 'processing',
        estimated_time: 30,
      },
    });
  } catch (error) {
    logger.error(`Get job status error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job status',
      },
    });
  }
};

/**
 * Get analysis results
 */
const getResults = async (req, res) => {
  try {
    const { id } = req.params; // recording_id or analysis_id

    const result = await AnalysisResult.findByRecordingId(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Analysis results not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        analysis: {
          id: result.id,
          recording_id: result.recording_id,
          risk_percentage: result.risk_percentage,
          confidence_level: result.confidence_level,
          biomarkers: result.biomarkers,
          shap_values: result.shap_values,
          analyzed_at: result.analyzed_at,
        },
      },
    });
  } catch (error) {
    logger.error(`Get results error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch results',
      },
    });
  }
};

module.exports = {
  queueAnalysis,
  getJobStatus,
  getResults,
};

