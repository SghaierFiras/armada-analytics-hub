const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import route modules
const merchantRoutes = require('./merchants');
const orderRoutes = require('./orders');
const performanceRoutes = require('./performance');
const geographicRoutes = require('./geographic');

/**
 * Main API Router
 * Combines all API route modules
 * Base path: /api
 */

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Armada Analytics API',
    version: '1.0.0',
    endpoints: {
      merchants: '/api/merchants',
      orders: '/api/orders',
      performance: '/api/performance',
      geographic: '/api/geographic',
      health: '/api/health'
    },
    documentation: 'See docs/API.md for detailed documentation',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/merchants', merchantRoutes);
router.use('/orders', orderRoutes);
router.use('/performance', performanceRoutes);
router.use('/geographic', geographicRoutes);

// Log all API route registrations
logger.info('API routes registered', {
  merchants: '/api/merchants',
  orders: '/api/orders',
  performance: '/api/performance',
  geographic: '/api/geographic'
});

module.exports = router;
