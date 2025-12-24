/**
 * Authorization Middleware
 * Role-based access control (RBAC)
 */

const { logger } = require('../utils/logger');

/**
 * Check if user has required role(s)
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        `Unauthorized access attempt: User ${req.user.id} (${userRole}) attempted to access ${req.path}`
      );
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

/**
 * Check if user owns resource or has admin role
 */
const authorizeResource = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
      });
    }

    // Specialists can access any resource
    if (req.user.role === 'specialist') {
      return next();
    }

    // Healthcare workers can access their assigned patients
    if (req.user.role === 'healthcare_worker') {
      // This would need to check patient assignment
      // For now, allow access
      return next();
    }

    // Patients can only access their own resources
    if (req.user.role === 'patient') {
      // Check if resource belongs to user
      // This would need to be implemented based on resource type
      return next();
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  authorizeResource,
};

