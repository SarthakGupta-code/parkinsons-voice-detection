/**
 * Patient Routes
 * Handles patient management endpoints
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorization');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/patients
 * @desc    Create a new patient record
 * @access  Private (Healthcare Worker, Specialist)
 */
router.post(
  '/',
  authorizeRoles(['healthcare_worker', 'specialist']),
  [
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('age').isInt({ min: 1, max: 150 }),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('village').optional().trim(),
    body('district').optional().trim(),
    body('state').optional().trim(),
    validateRequest,
  ],
  patientController.createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Get list of patients (paginated)
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    validateRequest,
  ],
  patientController.getPatients
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient details
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isUUID(),
    validateRequest,
  ],
  patientController.getPatient
);

/**
 * @route   PATCH /api/patients/:id
 * @desc    Update patient information
 * @access  Private (Healthcare Worker, Specialist)
 */
router.patch(
  '/:id',
  authorizeRoles(['healthcare_worker', 'specialist']),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('age').optional().isInt({ min: 1, max: 150 }),
    validateRequest,
  ],
  patientController.updatePatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft delete patient (HIPAA compliance)
 * @access  Private (Specialist only)
 */
router.delete(
  '/:id',
  authorizeRoles(['specialist']),
  [
    param('id').isUUID(),
    validateRequest,
  ],
  patientController.deletePatient
);

/**
 * @route   GET /api/patients/:id/history
 * @desc    Get patient assessment history
 * @access  Private
 */
router.get(
  '/:id/history',
  [
    param('id').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest,
  ],
  patientController.getPatientHistory
);

module.exports = router;

