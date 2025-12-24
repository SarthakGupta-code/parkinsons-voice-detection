/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { logger } = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
        },
      });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn(`Token verification failed: ${err.message}`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Invalid or expired token',
          },
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    });
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
      },
    });
  }
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
};

module.exports = {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
};

