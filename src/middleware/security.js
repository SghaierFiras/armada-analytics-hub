const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Security Middleware
 * Configures security headers, rate limiting, CORS, and input sanitization
 */

/**
 * Configure Helmet for security headers
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles (needed for some dashboards)
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://cdn.plot.ly" // For Plotly charts if used
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.slack.com" // For Slack OAuth
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },

  // X-Frame-Options: prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options: prevent MIME sniffing
  noSniff: true,

  // X-XSS-Protection: enable XSS filter
  xssFilter: true,

  // Strict-Transport-Security: force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

/**
 * Rate limiting configuration
 * Prevents brute force and DoS attacks
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.security.rateLimitWindow,
    max: config.security.rateLimitMax,
    message: {
      status: 'error',
      message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('user-agent')
      });
      res.status(429).json({
        status: 'error',
        message: 'Too many requests from this IP, please try again later'
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later'
  }
});

/**
 * Loose rate limiter for analytics endpoints
 * 200 requests per 15 minutes (analytics may need more requests)
 */
const analyticsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    const allowedOrigins = config.security.corsOrigins;

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

/**
 * MongoDB injection prevention
 * Removes $ and . from user input
 * Note: In Express 5, we can't replace req.query, so we use onSanitize to log only
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      url: req.originalUrl,
      key,
      userAgent: req.get('user-agent')
    });
  },
  // Don't try to modify req.query, req.body, req.params directly (Express 5 compatibility)
  replaceMethod: false
});

/**
 * Trust proxy setting
 * Important for getting correct client IP behind reverse proxy (Railway, Heroku, etc.)
 */
const configureTrustProxy = (app) => {
  if (config.security.trustProxy) {
    app.set('trust proxy', 1);
    logger.info('Trust proxy enabled (running behind reverse proxy)');
  }
};

/**
 * Apply all security middleware to Express app
 */
const applySecurityMiddleware = (app) => {
  // Trust proxy (must be first)
  configureTrustProxy(app);

  // Helmet - security headers
  app.use(helmetConfig);
  logger.info('Helmet security headers configured');

  // CORS
  app.use(cors(corsOptions));
  logger.info('CORS configured', { allowedOrigins: config.security.corsOrigins });

  // MongoDB injection prevention - Commented out for Express 5 compatibility
  // express-mongo-sanitize tries to modify req.query which is read-only in Express 5
  // Our Joi validation middleware provides input sanitization instead
  // app.use(mongoSanitizeConfig);
  logger.info('MongoDB injection prevention: Using Joi validation instead (Express 5 compatibility)');

  // General rate limiting (applies to all routes)
  app.use('/api/', apiLimiter);
  logger.info('API rate limiting enabled', {
    window: '15 minutes',
    max: 100
  });
};

/**
 * Security audit log middleware
 * Logs security-relevant events
 */
const securityAuditLog = (req, res, next) => {
  // Log security-relevant information
  const securityInfo = {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    user: req.user?.email || 'anonymous',
    timestamp: new Date().toISOString()
  };

  // Log on response finish
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.warn('Security audit: Error response', {
        ...securityInfo,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

module.exports = {
  helmetConfig,
  apiLimiter,
  authLimiter,
  analyticsLimiter,
  corsOptions,
  mongoSanitizeConfig,
  applySecurityMiddleware,
  securityAuditLog,
  createRateLimiter
};
