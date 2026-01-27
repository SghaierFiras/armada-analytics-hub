const PerformanceService = require('../services/PerformanceService');
const logger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Performance Controller
 * Handles HTTP requests for performance-related endpoints
 */
class PerformanceController {
  constructor() {
    this.performanceService = new PerformanceService();
  }

  /**
   * GET /api/performance/metrics
   * Get comprehensive performance metrics
   */
  getMetrics = catchAsync(async (req, res) => {
    const filters = req.validated.query || req.query;

    logger.info('Fetching performance metrics', {
      filters,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getPerformanceMetrics(filters);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/performance/completion-rates
   * Get completion rate analysis
   */
  getCompletionRates = catchAsync(async (req, res) => {
    const { year, period } = req.query;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();
    const analysisPeriod = period || 'monthly';

    logger.info('Fetching completion rates', {
      year: analysisYear,
      period: analysisPeriod,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getCompletionRates(
      analysisYear,
      analysisPeriod
    );

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/performance/efficiency
   * Get efficiency metrics
   */
  getEfficiency = catchAsync(async (req, res) => {
    const { year } = req.query;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching efficiency metrics', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getEfficiencyMetrics(analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/performance/growth
   * Get growth metrics
   */
  getGrowth = catchAsync(async (req, res) => {
    const { startYear, endYear } = req.query;

    const start = startYear ? parseInt(startYear) : 2023;
    const end = endYear ? parseInt(endYear) : new Date().getFullYear();

    logger.info('Fetching growth metrics', {
      startYear: start,
      endYear: end,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getGrowthMetrics(start, end);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/performance/annual
   * Get annual performance overview
   */
  getAnnual = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;

    const filters = {
      year: year || 'all',
      quarter: 'all',
      month: 'all'
    };

    logger.info('Fetching annual performance', {
      filters,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getPerformanceMetrics(filters);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/performance/monthly
   * Get monthly performance breakdown
   */
  getMonthly = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;
    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching monthly performance', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.performanceService.getCompletionRates(analysisYear, 'monthly');

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });
}

// Export singleton instance
module.exports = new PerformanceController();
