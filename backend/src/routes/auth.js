/**
 * Authentication Routes
 * Handles user registration, login, and authentication
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('role').isIn(['patient', 'healthcare_worker', 'specialist']),
    body('phone').optional().isMobilePhone(),
    validateRequest,
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateRequest,
  ],
  authController.login
);

/**
 * @route   POST /api/auth/social
 * @desc    Social login (Google/Apple)
 * @access  Public
 */
router.post(
  '/social',
  [
    body('provider').isIn(['google', 'apple']),
    body('token').notEmpty(),
    validateRequest,
  ],
  authController.socialLogin
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty(),
    validateRequest,
  ],
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  '/profile',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('phone').optional().isMobilePhone(),
    body('language_preference').optional().isLength({ min: 2, max: 10 }),
    validateRequest,
  ],
  authController.updateProfile
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  [
    body('token').notEmpty(),
    validateRequest,
  ],
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
    validateRequest,
  ],
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    validateRequest,
  ],
  authController.resetPassword
);

module.exports = router;

