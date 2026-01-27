const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error with context
  logger.errorWithContext(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.user?.email || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Development vs Production error responses
  if (config.env === 'production') {
    // Production: Don't leak error details
    return sendProductionError(err, res);
  } else {
    // Development: Send full error details
    return sendDevelopmentError(err, res);
  }
};

/**
 * Send detailed error in development
 */
function sendDevelopmentError(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}

/**
 * Send sanitized error in production
 */
function sendProductionError(err, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Programming or unknown error: don't leak error details
  else {
    // Log error for debugging
    logger.error('ERROR (non-operational):', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

/**
 * Catch async errors wrapper
 * Wraps async route handlers to catch promise rejections
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle 404 Not Found
 * Should be used after all routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.errorWithContext(err, { context: 'Unhandled Promise Rejection' });

  // Give server time to finish current requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.errorWithContext(err, { context: 'Uncaught Exception' });

  // Exit immediately for uncaught exceptions
  process.exit(1);
});

module.exports = {
  errorHandler,
  catchAsync,
  notFound
};
