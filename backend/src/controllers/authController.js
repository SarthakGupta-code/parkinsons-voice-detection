/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const config = require('../config');

// In production, use actual database models
// For now, using placeholder functions
const User = require('../models/User');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'User with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await User.create({
      id: uuidv4(),
      email,
      password_hash: passwordHash,
      name,
      role,
      phone,
      is_active: true,
      email_verified: false,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed',
      },
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
      },
    });
  }
};

/**
 * Social login (Google/Apple)
 */
const socialLogin = async (req, res) => {
  try {
    const { provider, token } = req.body;

    // In production, verify token with provider (Google/Apple)
    // For now, placeholder implementation
    logger.info(`Social login attempt: ${provider}`);

    res.status(501).json({
      success: false,
      error: {
        message: 'Social login not yet implemented',
      },
    });
  } catch (error) {
    logger.error(`Social login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Social login failed',
      },
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Invalid token type',
        },
      });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'User not found or inactive',
        },
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(403).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
      },
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // In production, invalidate refresh token in database/Redis
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
      },
    });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          language_preference: user.language_preference,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile',
      },
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, language_preference } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (language_preference) updates.language_preference = language_preference;

    const user = await User.update(req.user.id, updates);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          language_preference: user.language_preference,
        },
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
      },
    });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // In production, verify token and update user
    res.status(501).json({
      success: false,
      error: {
        message: 'Email verification not yet implemented',
      },
    });
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Email verification failed',
      },
    });
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
    }

    // In production, generate reset token and send email
    res.status(501).json({
      success: false,
      error: {
        message: 'Password reset not yet implemented',
      },
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Password reset failed',
      },
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // In production, verify token and update password
    res.status(501).json({
      success: false,
      error: {
        message: 'Password reset not yet implemented',
      },
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Password reset failed',
      },
    });
  }
};

module.exports = {
  register,
  login,
  socialLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

