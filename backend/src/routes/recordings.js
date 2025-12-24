/**
 * Recording Routes
 * Handles audio file upload and management
 */

const express = require('express');
const multer = require('multer');
const { body, param, query } = require('express-validator');
const recordingController = require('../controllers/recordingController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorization');
const { validateRequest } = require('../middleware/validation');
const config = require('../config');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/recordings
 * @desc    Upload audio recording
 * @access  Private (Healthcare Worker, Patient)
 */
router.post(
  '/',
  authorizeRoles(['healthcare_worker', 'patient']),
  upload.single('audio'),
  [
    body('patient_id').isUUID(),
    body('recording_type').isIn([
      'sustained_vowel',
      'rapid_syllable',
      'reading_passage',
      'spontaneous_speech',
    ]),
    body('duration_seconds').optional().isFloat({ min: 0 }),
    body('quality_score').optional().isInt({ min: 0, max: 100 }),
    validateRequest,
  ],
  recordingController.uploadRecording
);

/**
 * @route   GET /api/recordings
 * @desc    Get list of recordings (paginated)
 * @access  Private
 */
router.get(
  '/',
  [
    query('patient_id').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest,
  ],
  recordingController.getRecordings
);

/**
 * @route   GET /api/recordings/:id
 * @desc    Get recording details
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isUUID(),
    validateRequest,
  ],
  recordingController.getRecording
);

/**
 * @route   DELETE /api/recordings/:id
 * @desc    Delete recording
 * @access  Private (Healthcare Worker, Specialist)
 */
router.delete(
  '/:id',
  authorizeRoles(['healthcare_worker', 'specialist']),
  [
    param('id').isUUID(),
    validateRequest,
  ],
  recordingController.deleteRecording
);

/**
 * @route   POST /api/recordings/:id/analyze
 * @desc    Trigger AI analysis for recording
 * @access  Private (Healthcare Worker, Specialist)
 */
router.post(
  '/:id/analyze',
  authorizeRoles(['healthcare_worker', 'specialist']),
  [
    param('id').isUUID(),
    validateRequest,
  ],
  recordingController.triggerAnalysis
);

module.exports = router;

