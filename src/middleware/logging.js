const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Logging Middleware
 * HTTP request logging using Morgan with Winston integration
 */

/**
 * Custom Morgan token for response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '-';
  }

  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) / 1000000;

  return ms.toFixed(2);
});

/**
 * Custom Morgan token for user email
 */
morgan.token('user', (req) => {
  return req.user?.email || 'anonymous';
});

/**
 * Custom Morgan token for request body (sanitized)
 */
morgan.token('body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return '-';
  }

  // Sanitize sensitive fields
  const sanitized = { ...req.body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });

  return JSON.stringify(sanitized);
});

/**
 * Morgan format for development
 * Colorful, detailed output
 */
const developmentFormat = ':method :url :status :response-time-ms ms - :user - :body';

/**
 * Morgan format for production
 * JSON format for log parsing
 */
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms ms',
  user: ':user',
  ip: ':remote-addr',
  userAgent: ':user-agent',
  date: ':date[iso]'
});

/**
 * Skip function - don't log certain requests
 */
const skip = (req, res) => {
  // Skip health check endpoints
  if (req.url === '/health' || req.url === '/api/health') {
    return true;
  }

  // Skip static assets in production
  if (config.env === 'production' && req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return true;
  }

  return false;
};

/**
 * Stream object for Morgan to write to Winston
 */
const stream = {
  write: (message) => {
    // Remove trailing newline
    const cleanMessage = message.trim();

    // Parse JSON if in production format
    if (config.env === 'production') {
      try {
        const logData = JSON.parse(cleanMessage);
        logger.info('HTTP Request', logData);
      } catch (e) {
        logger.info(cleanMessage);
      }
    } else {
      logger.info(cleanMessage);
    }
  }
};

/**
 * Morgan middleware for HTTP request logging
 */
const requestLogger = morgan(
  config.env === 'production' ? productionFormat : developmentFormat,
  {
    stream,
    skip
  }
);

/**
 * Custom request logging middleware with detailed info
 * Use this for sensitive operations that need detailed logging
 */
const detailedRequestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.user?.email || 'anonymous',
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body)
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.email || 'anonymous'
    });
  });

  next();
};

/**
 * Sanitize request body for logging
 * Removes sensitive information
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'sessionId'
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
}

/**
 * Log slow requests
 * Middleware to identify performance bottlenecks
 */
const slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          statusCode: res.statusCode,
          user: req.user?.email || 'anonymous'
        });
      }
    });

    next();
  };
};

/**
 * Log API errors
 * Specifically logs failed API requests for monitoring
 */
const errorRequestLogger = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.error('API request failed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        ip: req.ip,
        user: req.user?.email || 'anonymous',
        query: req.query,
        params: req.params,
        body: sanitizeRequestBody(req.body)
      });
    }
  });

  next();
};

module.exports = {
  requestLogger,
  detailedRequestLogger,
  slowRequestLogger,
  errorRequestLogger
};
