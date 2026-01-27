const OrderService = require('../services/OrderService');
const logger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Order Controller
 * Handles HTTP requests for order-related endpoints
 */
class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * GET /api/orders/analytics
   * Get order analytics with filters
   */
  getAnalytics = catchAsync(async (req, res) => {
    const filters = req.validated.query || req.query;

    logger.info('Fetching order analytics', {
      filters,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.orderService.getOrderAnalytics(filters);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/orders/trends
   * Get order trends analysis
   */
  getTrends = catchAsync(async (req, res) => {
    const { startYear, endYear } = req.query;

    const start = startYear ? parseInt(startYear) : 2023;
    const end = endYear ? parseInt(endYear) : new Date().getFullYear();

    logger.info('Fetching order trends', {
      startYear: start,
      endYear: end,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.orderService.getOrderTrends(start, end);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/orders/quarterly
   * Get quarterly comparison
   */
  getQuarterly = catchAsync(async (req, res) => {
    const { year, compareYear } = req.query;

    const year1 = year ? parseInt(year) : new Date().getFullYear();
    const year2 = compareYear ? parseInt(compareYear) : null;

    logger.info('Fetching quarterly comparison', {
      year1,
      year2,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.orderService.getQuarterlyComparison(year1, year2);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/orders/top-months
   * Get top performing months
   */
  getTopMonths = catchAsync(async (req, res) => {
    const { year, limit } = req.query;

    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();
    const resultLimit = limit ? parseInt(limit) : 5;

    logger.info('Fetching top months', {
      year: analysisYear,
      limit: resultLimit,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.orderService.getTopMonths(analysisYear, resultLimit);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/orders/monthly
   * Get monthly statistics for a specific year
   */
  getMonthly = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;
    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching monthly order statistics', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    // Use the order repository directly for this simple query
    const OrderRepository = require('../db/repositories/OrderRepository');
    const orderRepo = new OrderRepository();
    const data = await orderRepo.getMonthlyStats(analysisYear);

    res.status(200).json({
      success: true,
      data: {
        year: analysisYear,
        monthly: data
      },
      timestamp: new Date().toISOString()
    });
  });
}

// Export singleton instance
module.exports = new OrderController();
