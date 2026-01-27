const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format with timestamp and colors
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format with colors for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Remove timestamp from meta to avoid duplication
      const { timestamp: _, ...cleanMeta } = meta;
      if (Object.keys(cleanMeta).length > 0) {
        metaStr = '\n' + JSON.stringify(cleanMeta, null, 2);
      }
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Error log - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Add console transport for non-production environments
 */
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Stream for Morgan HTTP logging middleware
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Convenience methods for common logging patterns
 */

// Log database operations
logger.db = (operation, collection, details = {}) => {
  logger.info('Database operation', {
    operation,
    collection,
    ...details
  });
};

// Log API requests
logger.request = (method, url, statusCode, responseTime, details = {}) => {
  logger.info('API request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ...details
  });
};

// Log authentication events
logger.auth = (event, user, success, details = {}) => {
  logger.info('Authentication event', {
    event,
    user,
    success,
    ...details
  });
};

// Log errors with context
logger.errorWithContext = (error, context = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  });
};

module.exports = logger;
