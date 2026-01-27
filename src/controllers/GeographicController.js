const GeographicService = require('../services/GeographicService');
const logger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Geographic Controller
 * Handles HTTP requests for geographic analysis endpoints
 */
class GeographicController {
  constructor() {
    this.geographicService = new GeographicService();
  }

  /**
   * GET /api/geographic/analysis
   * Get comprehensive geographic analysis
   */
  getAnalysis = catchAsync(async (req, res) => {
    const filters = req.validated.query || req.query;

    logger.info('Fetching geographic analysis', {
      filters,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.geographicService.getGeographicAnalysis(filters);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/geographic/area/:area
   * Get statistics for a specific area
   */
  getAreaStats = catchAsync(async (req, res) => {
    const { area } = req.params;
    const { year } = req.query;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching area statistics', {
      area,
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.geographicService.getAreaStats(area, analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/geographic/governorates
   * Get governorate statistics
   */
  getGovernorateStats = catchAsync(async (req, res) => {
    const { year } = req.query;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching governorate statistics', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.geographicService.getGovernorateStats(analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /api/geographic/compare
   * Compare multiple areas
   */
  compareAreas = catchAsync(async (req, res) => {
    const { areas, year } = req.body;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Comparing areas', {
      areas,
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.geographicService.compareAreas(areas, analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });
}

// Export singleton instance
module.exports = new GeographicController();
