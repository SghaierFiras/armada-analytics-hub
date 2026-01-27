const express = require('express');
const router = express.Router();
const geographicController = require('../controllers/GeographicController');
const { validateFilters } = require('../middleware/validation');
const { analyticsCache } = require('../middleware/cache');

/**
 * Geographic Routes
 * Base path: /api/geographic
 */

/**
 * GET /api/geographic/analysis
 * Get comprehensive geographic analysis
 * Query params: year, area
 */
router.get(
  '/analysis',
  validateFilters,
  analyticsCache,
  geographicController.getAnalysis
);

/**
 * GET /api/geographic/area/:area
 * Get statistics for a specific area
 * URL params: area
 * Query params: year
 */
router.get(
  '/area/:area',
  validateFilters,
  analyticsCache,
  geographicController.getAreaStats
);

/**
 * GET /api/geographic/governorates
 * Get governorate-level statistics
 * Query params: year
 */
router.get(
  '/governorates',
  validateFilters,
  analyticsCache,
  geographicController.getGovernorateStats
);

/**
 * POST /api/geographic/compare
 * Compare multiple areas
 * Body: { areas: string[], year: number }
 */
router.post(
  '/compare',
  analyticsCache,
  geographicController.compareAreas
);

module.exports = router;
