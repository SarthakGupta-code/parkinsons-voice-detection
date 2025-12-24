/**
 * Report Routes
 * Handles report generation and sharing
 */

const express = require('express');
const { param, body } = require('express-validator');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/reports/:id
 * @desc    Get report data
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isUUID(),
    validateRequest,
  ],
  reportController.getReport
);

/**
 * @route   GET /api/reports/:id/pdf
 * @desc    Generate PDF report
 * @access  Private
 */
router.get(
  '/:id/pdf',
  [
    param('id').isUUID(),
    validateRequest,
  ],
  reportController.generatePDF
);

/**
 * @route   POST /api/reports/:id/share
 * @desc    Share report via SMS/Email
 * @access  Private
 */
router.post(
  '/:id/share',
  [
    param('id').isUUID(),
    body('method').isIn(['email', 'sms', 'whatsapp']),
    body('recipient').notEmpty(),
    validateRequest,
  ],
  reportController.shareReport
);

module.exports = router;

