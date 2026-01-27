const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/PerformanceController');
const { validateFilters } = require('../middleware/validation');
const { analyticsCache } = require('../middleware/cache');

/**
 * Performance Routes
 * Base path: /api/performance
 */

/**
 * GET /api/performance/metrics
 * Get comprehensive performance metrics
 * Query params: year, quarter, month
 */
router.get(
  '/metrics',
  validateFilters,
  analyticsCache,
  performanceController.getMetrics
);

/**
 * GET /api/performance/completion-rates
 * Get completion rate analysis
 * Query params: year, period (monthly/quarterly)
 */
router.get(
  '/completion-rates',
  validateFilters,
  analyticsCache,
  performanceController.getCompletionRates
);

/**
 * GET /api/performance/efficiency
 * Get efficiency metrics (orders per trip, cancellation rates, etc.)
 * Query params: year
 */
router.get(
  '/efficiency',
  validateFilters,
  analyticsCache,
  performanceController.getEfficiency
);

/**
 * GET /api/performance/growth
 * Get growth metrics over time
 * Query params: startYear, endYear
 */
router.get(
  '/growth',
  analyticsCache,
  performanceController.getGrowth
);

/**
 * GET /api/performance/annual
 * Get annual performance overview
 * Query params: year
 */
router.get(
  '/annual',
  validateFilters,
  analyticsCache,
  performanceController.getAnnual
);

/**
 * GET /api/performance/monthly
 * Get monthly performance breakdown
 * Query params: year
 */
router.get(
  '/monthly',
  validateFilters,
  analyticsCache,
  performanceController.getMonthly
);

module.exports = router;
