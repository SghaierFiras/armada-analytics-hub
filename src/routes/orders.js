const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const { validateFilters } = require('../middleware/validation');
const { analyticsCache } = require('../middleware/cache');

/**
 * Order Routes
 * Base path: /api/orders
 */

/**
 * GET /api/orders/analytics
 * Get order analytics with optional filters
 * Query params: year, quarter, status
 */
router.get(
  '/analytics',
  validateFilters,
  analyticsCache,
  orderController.getAnalytics
);

/**
 * GET /api/orders/trends
 * Get order trends analysis over time
 * Query params: startYear, endYear
 */
router.get(
  '/trends',
  analyticsCache,
  orderController.getTrends
);

/**
 * GET /api/orders/quarterly
 * Get quarterly comparison
 * Query params: year, compareYear (optional)
 */
router.get(
  '/quarterly',
  validateFilters,
  analyticsCache,
  orderController.getQuarterly
);

/**
 * GET /api/orders/top-months
 * Get top performing months
 * Query params: year, limit (default: 5)
 */
router.get(
  '/top-months',
  validateFilters,
  analyticsCache,
  orderController.getTopMonths
);

/**
 * GET /api/orders/monthly
 * Get monthly order statistics
 * Query params: year
 */
router.get(
  '/monthly',
  validateFilters,
  analyticsCache,
  orderController.getMonthly
);

module.exports = router;
