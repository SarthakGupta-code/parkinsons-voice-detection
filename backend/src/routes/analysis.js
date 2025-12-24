/**
 * Analysis Routes
 * Handles analysis job queue and results
 */

const express = require('express');
const { param, query } = require('express-validator');
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/analysis/queue
 * @desc    Queue analysis job
 * @access  Private
 */
router.post('/queue', analysisController.queueAnalysis);

/**
 * @route   GET /api/analysis/:job_id
 * @desc    Get analysis job status
 * @access  Private
 */
router.get(
  '/:job_id',
  [
    param('job_id').isUUID(),
    validateRequest,
  ],
  analysisController.getJobStatus
);

/**
 * @route   GET /api/analysis/:id/results
 * @desc    Get analysis results
 * @access  Private
 */
router.get(
  '/:id/results',
  [
    param('id').isUUID(),
    validateRequest,
  ],
  analysisController.getResults
);

module.exports = router;

