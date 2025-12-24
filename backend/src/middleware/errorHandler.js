/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const { logger } = require('../utils/logger');

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error
  logger.error({
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      status: statusCode,
      path: req.path,
      method: req.method,
    },
  });
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

