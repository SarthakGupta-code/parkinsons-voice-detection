/**
 * Recording Controller
 * Handles audio file upload and management
 */

const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const Recording = require('../models/Recording');
const { logger } = require('../utils/logger');
const config = require('../config');

// Configure AWS S3
const s3 = new AWS.S3({
  region: config.AWS_REGION,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
});

/**
 * Upload audio recording
 */
const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No audio file provided',
        },
      });
    }

    const { patient_id, recording_type, duration_seconds, quality_score } = req.body;

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `recordings/${patient_id}/${fileName}`;

    // Upload to S3
    const uploadParams = {
      Bucket: config.AWS_S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ServerSideEncryption: 'AES256',
    };

    const s3Result = await s3.upload(uploadParams).promise();
    const fileUrl = s3Result.Location;

    // Create recording record
    const recording = await Recording.create({
      id: uuidv4(),
      patient_id,
      healthcare_worker_id: req.user.id,
      recording_type,
      file_url: fileUrl,
      file_size_bytes: req.file.size,
      duration_seconds: duration_seconds ? parseFloat(duration_seconds) : null,
      quality_score: quality_score ? parseInt(quality_score) : null,
    });

    logger.info(`Recording uploaded: ${recording.id} for patient ${patient_id}`);

    res.status(201).json({
      success: true,
      data: {
        recording: {
          id: recording.id,
          patient_id: recording.patient_id,
          recording_type: recording.recording_type,
          file_url: recording.file_url,
          duration_seconds: recording.duration_seconds,
          quality_score: recording.quality_score,
          recorded_at: recording.recorded_at,
        },
      },
    });
  } catch (error) {
    logger.error(`Upload recording error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload recording',
      },
    });
  }
};

/**
 * Get list of recordings
 */
const getRecordings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const patient_id = req.query.patient_id;

    const { recordings, total } = await Recording.findAll({
      patient_id,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        recordings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error(`Get recordings error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch recordings',
      },
    });
  }
};

/**
 * Get recording by ID
 */
const getRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id);

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Recording not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        recording,
      },
    });
  } catch (error) {
    logger.error(`Get recording error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch recording',
      },
    });
  }
};

/**
 * Delete recording
 */
const deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id);
    if (!recording) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Recording not found',
        },
      });
    }

    // Delete from S3
    const s3Key = recording.file_url.split('.com/')[1];
    await s3.deleteObject({
      Bucket: config.AWS_S3_BUCKET,
      Key: s3Key,
    }).promise();

    // Delete from database
    await Recording.delete(id);

    logger.info(`Recording deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Recording deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete recording error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete recording',
      },
    });
  }
};

/**
 * Trigger AI analysis for recording
 */
const triggerAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id);
    if (!recording) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Recording not found',
        },
      });
    }

    if (recording.is_analyzed) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Recording already analyzed',
        },
      });
    }

    // Queue analysis job (in production, use Bull/Redis)
    const AnalysisJob = require('../services/analysisQueue');
    const jobId = await AnalysisJob.queueAnalysis(recording);

    // Update recording
    await Recording.update(id, {
      analysis_job_id: jobId,
    });

    logger.info(`Analysis queued: ${jobId} for recording ${id}`);

    res.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'queued',
        message: 'Analysis job queued successfully',
      },
    });
  } catch (error) {
    logger.error(`Trigger analysis error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to trigger analysis',
      },
    });
  }
};

module.exports = {
  uploadRecording,
  getRecordings,
  getRecording,
  deleteRecording,
  triggerAnalysis,
};

