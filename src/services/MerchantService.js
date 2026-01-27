const OrderRepository = require('../db/repositories/OrderRepository');
const MerchantRepository = require('../db/repositories/MerchantRepository');
const BranchRepository = require('../db/repositories/BranchRepository');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Merchant Service
 * Business logic for merchant analytics and operations
 * Orchestrates data from multiple repositories
 */
class MerchantService {
  constructor() {
    this.orderRepo = new OrderRepository();
    this.merchantRepo = new MerchantRepository();
    this.branchRepo = new BranchRepository();
  }

  /**
   * Get comprehensive merchant analytics
   * @param {Object} filters - year, size, area filters
   * @returns {Promise<Object>} Merchant analytics data
   */
  async getMerchantAnalytics(filters = {}) {
    const { year = 'all', size = 'all', area = 'all' } = filters;

    logger.info('Fetching merchant analytics', { filters });

    try {
      // Determine year range
      const currentYear = new Date().getFullYear();
      const years = year === 'all' ? [2023, 2024, 2025] : [parseInt(year)];

      // Get merchant profiles across years
      const merchantProfiles = await this.merchantRepo.getMerchantProfiles(
        Math.min(...years),
        Math.max(...years)
      );

      // Calculate total merchants
      const totalMerchants = merchantProfiles.length;

      // Get active merchants for latest year
      const latestYear = Math.max(...years);
      const activeMerchantsData = await this.merchantRepo.getActiveMerchantsByYear(latestYear);
      const activeMerchants = activeMerchantsData.length;

      // Categorize by business size
      const sizeCategories = this._categorizeMerchantsBySize(merchantProfiles, year);

      // Get geographic distribution
      const geoDistribution = await this.merchantRepo.getGeographicDistribution(
        year === 'all' ? null : parseInt(year)
      );

      // Get multi-branch merchants
      const multiBranchMerchants = await this.merchantRepo.getMultiBranchMerchants(latestYear);

      // Calculate growth metrics
      const growthMetrics = await this._calculateGrowthMetrics(years);

      // Apply filters
      let filteredData = {
        totalMerchants,
        activeMerchants,
        inactiveMerchants: totalMerchants - activeMerchants,
        multiBranchCount: multiBranchMerchants.length,
        sizeDistribution: sizeCategories,
        geographicDistribution: geoDistribution,
        topMultiBranchMerchants: multiBranchMerchants.slice(0, 10),
        growthMetrics,
        filters: { year, size, area }
      };

      // Apply size filter
      if (size !== 'all') {
        filteredData = this._applySizeFilter(filteredData, size);
      }

      // Apply area filter
      if (area !== 'all') {
        filteredData = this._applyAreaFilter(filteredData, area);
      }

      logger.info('Merchant analytics completed', {
        totalMerchants,
        activeMerchants,
        filters
      });

      return filteredData;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get merchant analytics',
        filters
      });
      throw error;
    }
  }

  /**
   * Get merchant growth analysis
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Growth cohort data
   */
  async getMerchantGrowthAnalysis(year) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching merchant growth analysis for ${year}`);

    try {
      const cohorts = await this.merchantRepo.getMerchantGrowthCohorts(year);
      const previousYearCohorts = await this.merchantRepo.getMerchantGrowthCohorts(year - 1);

      // Calculate retention rate
      const retentionRate = previousYearCohorts.total > 0
        ? ((cohorts.returning.count / previousYearCohorts.total) * 100).toFixed(2)
        : 0;

      return {
        year,
        cohorts,
        retentionRate: parseFloat(retentionRate),
        insights: {
          newMerchantGrowth: cohorts.new.percentage,
          customerRetention: retentionRate,
          totalActive: cohorts.total
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get merchant growth analysis',
        year
      });
      throw error;
    }
  }

  /**
   * Get business size breakdown with detailed metrics
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Business size categories
   */
  async getBusinessSizeBreakdown(year) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching business size breakdown for ${year}`);

    try {
      const categories = await this.merchantRepo.getMerchantsByVolume(year);

      // Calculate percentages and totals
      const total = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);

      Object.keys(categories).forEach(key => {
        const category = categories[key];
        category.percentage = total > 0
          ? ((category.count / total) * 100).toFixed(2)
          : 0;

        // Calculate average orders per merchant in category
        const totalOrders = category.merchants.reduce((sum, m) => sum + m.orders, 0);
        category.avgOrdersPerMerchant = category.count > 0
          ? Math.round(totalOrders / category.count)
          : 0;

        category.totalOrders = totalOrders;
      });

      return {
        year,
        total,
        categories,
        insights: {
          largestCategory: this._findLargestCategory(categories),
          fastestGrowing: this._identifyFastestGrowing(categories)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get business size breakdown',
        year
      });
      throw error;
    }
  }

  /**
   * Get multi-branch merchant analysis
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Multi-branch analysis
   */
  async getMultiBranchAnalysis(year) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching multi-branch analysis for ${year}`);

    try {
      const multiBranchMerchants = await this.merchantRepo.getMultiBranchMerchants(year);
      const allActiveMerchants = await this.merchantRepo.getActiveMerchantsByYear(year);

      const multiBranchPercentage = allActiveMerchants.length > 0
        ? ((multiBranchMerchants.length / allActiveMerchants.length) * 100).toFixed(2)
        : 0;

      // Calculate average branches
      const avgBranches = multiBranchMerchants.length > 0
        ? (multiBranchMerchants.reduce((sum, m) => sum + m.branchCount, 0) / multiBranchMerchants.length).toFixed(2)
        : 0;

      return {
        year,
        totalMultiBranch: multiBranchMerchants.length,
        totalActiveMerchants: allActiveMerchants.length,
        percentage: parseFloat(multiBranchPercentage),
        avgBranchesPerMerchant: parseFloat(avgBranches),
        topMerchants: multiBranchMerchants.slice(0, 20),
        insights: {
          expansionRate: multiBranchPercentage,
          scalePotential: this._assessScalePotential(multiBranchMerchants)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get multi-branch analysis',
        year
      });
      throw error;
    }
  }

  /**
   * Private: Categorize merchants by business size
   * @param {Array} merchants - Merchant profiles
   * @param {string|number} year - Year filter
   * @returns {Object} Size categories
   */
  _categorizeMerchantsBySize(merchants, year) {
    const categories = {
      micro: { range: '0-100', count: 0, merchants: [] },
      small: { range: '100-1,000', count: 0, merchants: [] },
      medium: { range: '1,000-10,000', count: 0, merchants: [] },
      large: { range: '10,000-50,000', count: 0, merchants: [] },
      enterprise: { range: '50,000+', count: 0, merchants: [] }
    };

    merchants.forEach(merchant => {
      const avgOrders = Math.round(merchant.avgAnnualOrders);
      let category;

      if (avgOrders < 100) category = 'micro';
      else if (avgOrders < 1000) category = 'small';
      else if (avgOrders < 10000) category = 'medium';
      else if (avgOrders < 50000) category = 'large';
      else category = 'enterprise';

      categories[category].count++;
      categories[category].merchants.push({
        id: merchant._id,
        name: merchant.name,
        avgOrders
      });
    });

    // Calculate percentages
    const total = merchants.length;
    Object.keys(categories).forEach(key => {
      categories[key].percentage = total > 0
        ? ((categories[key].count / total) * 100).toFixed(2)
        : 0;
    });

    return categories;
  }

  /**
   * Private: Calculate growth metrics across years
   * @param {Array} years - Years to analyze
   * @returns {Promise<Object>} Growth metrics
   */
  async _calculateGrowthMetrics(years) {
    if (years.length < 2) {
      return { available: false, message: 'Multiple years required for growth calculation' };
    }

    try {
      const metrics = {};

      for (let i = 1; i < years.length; i++) {
        const prevYear = years[i - 1];
        const currYear = years[i];

        const prevYearMerchants = await this.merchantRepo.getActiveMerchantsByYear(prevYear);
        const currYearMerchants = await this.merchantRepo.getActiveMerchantsByYear(currYear);

        const growth = prevYearMerchants.length > 0
          ? (((currYearMerchants.length - prevYearMerchants.length) / prevYearMerchants.length) * 100).toFixed(2)
          : 0;

        metrics[`${prevYear}-${currYear}`] = {
          [prevYear]: prevYearMerchants.length,
          [currYear]: currYearMerchants.length,
          growth: parseFloat(growth),
          absolute: currYearMerchants.length - prevYearMerchants.length
        };
      }

      return metrics;
    } catch (error) {
      logger.errorWithContext(error, { context: 'Failed to calculate growth metrics' });
      return { available: false, error: error.message };
    }
  }

  /**
   * Private: Apply size filter to analytics data
   */
  _applySizeFilter(data, size) {
    // Filter logic for size categories
    const filtered = { ...data };
    filtered.sizeDistribution = { [size]: data.sizeDistribution[size] };
    return filtered;
  }

  /**
   * Private: Apply area filter to analytics data
   */
  _applyAreaFilter(data, area) {
    // Filter logic for geographic areas
    const filtered = { ...data };
    filtered.geographicDistribution = data.geographicDistribution.filter(
      geo => geo._id === area || geo.areas.some(a => a.area === area)
    );
    return filtered;
  }

  /**
   * Private: Find largest category by merchant count
   */
  _findLargestCategory(categories) {
    let largest = { name: '', count: 0 };
    Object.keys(categories).forEach(key => {
      if (categories[key].count > largest.count) {
        largest = { name: key, count: categories[key].count };
      }
    });
    return largest;
  }

  /**
   * Private: Identify fastest growing category (placeholder)
   */
  _identifyFastestGrowing(categories) {
    // This would require historical data comparison
    return { message: 'Historical comparison required' };
  }

  /**
   * Private: Assess scale potential based on multi-branch data
   */
  _assessScalePotential(multiBranchMerchants) {
    const highScaleMerchants = multiBranchMerchants.filter(m => m.branchCount >= 5);
    return {
      highScale: highScaleMerchants.length,
      percentage: multiBranchMerchants.length > 0
        ? ((highScaleMerchants.length / multiBranchMerchants.length) * 100).toFixed(2)
        : 0
    };
  }
}

module.exports = MerchantService;
