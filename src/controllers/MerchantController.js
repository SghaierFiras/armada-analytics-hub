const MerchantService = require('../services/MerchantService');
const logger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Merchant Controller
 * Handles HTTP requests for merchant-related endpoints
 */
class MerchantController {
  constructor() {
    this.merchantService = new MerchantService();
  }

  /**
   * GET /api/merchants/analytics
   * Get merchant analytics with filters
   */
  getAnalytics = catchAsync(async (req, res) => {
    const filters = req.validated.query || req.query;

    logger.info('Fetching merchant analytics', {
      filters,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.merchantService.getMerchantAnalytics(filters);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/merchants/growth-cohorts
   * Get merchant growth analysis (new vs returning)
   */
  getGrowthCohorts = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;
    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching merchant growth cohorts', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.merchantService.getMerchantGrowthAnalysis(analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/merchants/size-breakdown
   * Get business size distribution
   */
  getSizeBreakdown = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;
    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching merchant size breakdown', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.merchantService.getBusinessSizeBreakdown(analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/merchants/multi-branch
   * Get multi-branch merchant analysis
   */
  getMultiBranch = catchAsync(async (req, res) => {
    const { year } = req.validated.query || req.query;
    const analysisYear = year && year !== 'all' ? parseInt(year) : new Date().getFullYear();

    logger.info('Fetching multi-branch merchant analysis', {
      year: analysisYear,
      user: req.user?.email,
      ip: req.ip
    });

    const data = await this.merchantService.getMultiBranchAnalysis(analysisYear);

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  });
}

// Export singleton instance
module.exports = new MerchantController();
