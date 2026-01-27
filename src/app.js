const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');

// Import middleware
const { applySecurityMiddleware, securityAuditLog } = require('./middleware/security');
const { requestLogger, slowRequestLogger, errorRequestLogger } = require('./middleware/logging');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validation');

// Import routes
const apiRoutes = require('./routes');

/**
 * Create and configure Express application
 * This is the main application factory
 */
function createApp() {
  const app = express();

  // ============================================
  // 1. TRUST PROXY & BASIC MIDDLEWARE
  // ============================================

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // 2. SECURITY MIDDLEWARE
  // ============================================

  // Apply all security middleware (helmet, CORS, rate limiting, etc.)
  applySecurityMiddleware(app);

  // Security audit logging
  app.use(securityAuditLog);

  // ============================================
  // 3. LOGGING MIDDLEWARE
  // ============================================

  // HTTP request logging
  app.use(requestLogger);

  // Slow request detection (> 1 second)
  app.use(slowRequestLogger(1000));

  // Error request logging
  app.use(errorRequestLogger);

  // ============================================
  // 4. INPUT SANITIZATION
  // ============================================

  // Sanitize request body
  app.use(sanitizeBody);

  // ============================================
  // 5. API ROUTES
  // ============================================

  // Mount API routes
  app.use('/api', apiRoutes);

  logger.info('API routes mounted at /api');

  // ============================================
  // 6. ERROR HANDLING
  // ============================================

  // 404 handler - must be after all routes
  app.use(notFound);

  // Global error handler - must be last
  app.use(errorHandler);

  logger.info('Express app configured successfully', {
    environment: config.env,
    port: config.port
  });

  return app;
}

module.exports = createApp;
