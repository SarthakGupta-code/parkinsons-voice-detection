/**
 * Analysis Queue Service
 * Manages analysis job queue using Bull and Redis
 */

const Bull = require('bull');
const config = require('../config');
const { logger } = require('../utils/logger');

// Create queue
const analysisQueue = new Bull('analysis', {
  redis: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
  },
});

/**
 * Queue analysis job
 */
async function queueAnalysis(recording) {
  const job = await analysisQueue.add(
    'analyze-voice',
    {
      recording_id: recording.id,
      file_url: recording.file_url,
      patient_id: recording.patient_id,
      recording_type: recording.recording_type,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      priority: 1, // Higher priority for urgent cases
    }
  );

  logger.info(`Analysis job queued: ${job.id} for recording ${recording.id}`);
  return job.id;
}

/**
 * Process analysis jobs
 */
analysisQueue.process('analyze-voice', async (job) => {
  const { recording_id, file_url, patient_id, recording_type } = job.data;

  logger.info(`Processing analysis job ${job.id} for recording ${recording_id}`);

  try {
    // Call ML service
    const axios = require('axios');
    const response = await axios.post(`${config.ML_SERVICE_URL}/api/ml/analyze`, {
      audio_file_url: file_url,
      patient_id,
      recording_type,
    });

    // Save results to database
    const AnalysisResult = require('../models/AnalysisResult');
    const Recording = require('../models/Recording');
    const { v4: uuidv4 } = require('uuid');

    const result = await AnalysisResult.create({
      id: uuidv4(),
      recording_id,
      risk_percentage: response.data.risk_percentage,
      confidence_level: response.data.confidence_level,
      biomarkers: response.data.biomarkers,
      shap_values: response.data.shap_values,
      model_version: '1.0.0',
    });

    // Update recording
    await Recording.update(recording_id, {
      is_analyzed: true,
    });

    logger.info(`Analysis completed for recording ${recording_id}`);
    return result;
  } catch (error) {
    logger.error(`Analysis job failed: ${error.message}`);
    throw error;
  }
});

module.exports = {
  queueAnalysis,
  analysisQueue,
};

