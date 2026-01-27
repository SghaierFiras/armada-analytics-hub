const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/MerchantController');
const { validateFilters } = require('../middleware/validation');
const { analyticsCache } = require('../middleware/cache');

/**
 * Merchant Routes
 * Base path: /api/merchants
 */

/**
 * GET /api/merchants/analytics
 * Get merchant analytics with optional filters
 * Query params: year, size, area
 */
router.get(
  '/analytics',
  validateFilters,
  analyticsCache,
  merchantController.getAnalytics
);

/**
 * GET /api/merchants/growth-cohorts
 * Get merchant growth analysis (new vs returning merchants)
 * Query params: year
 */
router.get(
  '/growth-cohorts',
  validateFilters,
  analyticsCache,
  merchantController.getGrowthCohorts
);

/**
 * GET /api/merchants/size-breakdown
 * Get business size distribution
 * Query params: year
 */
router.get(
  '/size-breakdown',
  validateFilters,
  analyticsCache,
  merchantController.getSizeBreakdown
);

/**
 * GET /api/merchants/multi-branch
 * Get multi-branch merchant analysis
 * Query params: year
 */
router.get(
  '/multi-branch',
  validateFilters,
  analyticsCache,
  merchantController.getMultiBranch
);

module.exports = router;
