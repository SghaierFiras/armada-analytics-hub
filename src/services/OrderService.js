const OrderRepository = require('../db/repositories/OrderRepository');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Order Service
 * Business logic for order analytics and trends
 */
class OrderService {
  constructor() {
    this.orderRepo = new OrderRepository();
  }

  /**
   * Get comprehensive order analytics
   * @param {Object} filters - year, quarter, status filters
   * @returns {Promise<Object>} Order analytics data
   */
  async getOrderAnalytics(filters = {}) {
    const { year = 'all', quarter = 'all', status = 'all' } = filters;

    logger.info('Fetching order analytics', { filters });

    try {
      // Determine years to analyze
      const years = year === 'all' ? [2023, 2024, 2025] : [parseInt(year)];
      const latestYear = Math.max(...years);

      // Get annual statistics
      const annualStats = await this.orderRepo.getAnnualStats(
        Math.min(...years),
        Math.max(...years)
      );

      // Get monthly stats for latest year
      const monthlyStats = await this.orderRepo.getMonthlyStats(latestYear);

      // Get quarterly stats for latest year
      const quarterlyStats = await this.orderRepo.getQuarterlyStats(latestYear);

      // Get status breakdown
      const statusBreakdown = await this.orderRepo.getOrdersByStatus(latestYear);

      // Calculate totals
      const totalOrders = annualStats.reduce((sum, stat) => sum + stat.totalOrders, 0);
      const latestYearOrders = annualStats.find(s => s._id === latestYear)?.totalOrders || 0;

      // Calculate completion rates
      const completionRate = this._calculateCompletionRate(monthlyStats);

      // Get growth trends
      const growthTrends = this._calculateGrowthTrends(annualStats);

      // Apply filters
      let filteredData = {
        totalOrders,
        latestYearOrders,
        annual: annualStats,
        monthly: monthlyStats,
        quarterly: quarterlyStats,
        statusBreakdown: this._formatStatusBreakdown(statusBreakdown),
        completionRate,
        growthTrends,
        filters: { year, quarter, status }
      };

      // Apply quarter filter
      if (quarter !== 'all') {
        filteredData.quarterly = quarterlyStats.filter(q => q._id === quarter);
      }

      // Apply status filter
      if (status !== 'all') {
        filteredData = this._applyStatusFilter(filteredData, status);
      }

      logger.info('Order analytics completed', {
        totalOrders,
        latestYearOrders,
        filters
      });

      return filteredData;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get order analytics',
        filters
      });
      throw error;
    }
  }

  /**
   * Get order trends analysis
   * @param {number} startYear - Start year
   * @param {number} endYear - End year
   * @returns {Promise<Object>} Trend analysis
   */
  async getOrderTrends(startYear, endYear) {
    if (!startYear || !endYear || isNaN(startYear) || isNaN(endYear)) {
      throw new ValidationError('Valid start and end years are required');
    }

    logger.info(`Fetching order trends from ${startYear} to ${endYear}`);

    try {
      const annualStats = await this.orderRepo.getAnnualStats(startYear, endYear);

      // Calculate year-over-year growth
      const yoyGrowth = [];
      for (let i = 1; i < annualStats.length; i++) {
        const prev = annualStats[i - 1];
        const curr = annualStats[i];
        const growth = prev.totalOrders > 0
          ? (((curr.totalOrders - prev.totalOrders) / prev.totalOrders) * 100).toFixed(2)
          : 0;

        yoyGrowth.push({
          period: `${prev._id}-${curr._id}`,
          growth: parseFloat(growth),
          previous: prev.totalOrders,
          current: curr.totalOrders,
          absolute: curr.totalOrders - prev.totalOrders
        });
      }

      // Identify trends
      const trend = this._identifyTrend(yoyGrowth);

      // Calculate average growth rate
      const avgGrowthRate = yoyGrowth.length > 0
        ? (yoyGrowth.reduce((sum, g) => sum + g.growth, 0) / yoyGrowth.length).toFixed(2)
        : 0;

      return {
        period: { start: startYear, end: endYear },
        annual: annualStats,
        yoyGrowth,
        avgGrowthRate: parseFloat(avgGrowthRate),
        trend: trend,
        insights: {
          strongestYear: this._findStrongestYear(annualStats),
          totalGrowth: this._calculateTotalGrowth(annualStats)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get order trends',
        startYear,
        endYear
      });
      throw error;
    }
  }

  /**
   * Get quarterly comparison
   * @param {number} year1 - First year
   * @param {number} year2 - Second year (optional)
   * @returns {Promise<Object>} Quarterly comparison
   */
  async getQuarterlyComparison(year1, year2 = null) {
    if (!year1 || isNaN(year1)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching quarterly comparison for ${year1}${year2 ? ` vs ${year2}` : ''}`);

    try {
      const year1Quarterly = await this.orderRepo.getQuarterlyStats(year1);

      const result = {
        year1: {
          year: year1,
          quarters: year1Quarterly
        }
      };

      if (year2) {
        const year2Quarterly = await this.orderRepo.getQuarterlyStats(year2);
        result.year2 = {
          year: year2,
          quarters: year2Quarterly
        };

        // Calculate quarter-by-quarter comparison
        result.comparison = this._compareQuarters(year1Quarterly, year2Quarterly);
      }

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get quarterly comparison',
        year1,
        year2
      });
      throw error;
    }
  }

  /**
   * Get top performing months
   * @param {number} year - Year to analyze
   * @param {number} limit - Number of top months
   * @returns {Promise<Array>} Top months by order volume
   */
  async getTopMonths(year, limit = 5) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching top ${limit} months for ${year}`);

    try {
      const monthlyStats = await this.orderRepo.getMonthlyStats(year);

      // Sort by total orders and take top N
      const topMonths = monthlyStats
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, limit)
        .map(month => ({
          month: this._getMonthName(month._id),
          monthNumber: month._id,
          totalOrders: month.totalOrders,
          completed: month.completed,
          canceled: month.canceled,
          completionRate: month.totalOrders > 0
            ? ((month.completed / month.totalOrders) * 100).toFixed(2)
            : 0
        }));

      return {
        year,
        topMonths,
        insights: {
          peakMonth: topMonths[0],
          avgTopMonthOrders: this._calculateAverage(topMonths.map(m => m.totalOrders))
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get top months',
        year,
        limit
      });
      throw error;
    }
  }

  /**
   * Private: Calculate overall completion rate from monthly stats
   */
  _calculateCompletionRate(monthlyStats) {
    const totals = monthlyStats.reduce(
      (acc, month) => ({
        total: acc.total + month.totalOrders,
        completed: acc.completed + month.completed,
        canceled: acc.canceled + month.canceled
      }),
      { total: 0, completed: 0, canceled: 0 }
    );

    return {
      overall: totals.total > 0
        ? ((totals.completed / totals.total) * 100).toFixed(2)
        : 0,
      completed: totals.completed,
      canceled: totals.canceled,
      total: totals.total
    };
  }

  /**
   * Private: Calculate growth trends from annual stats
   */
  _calculateGrowthTrends(annualStats) {
    if (annualStats.length < 2) {
      return { available: false, message: 'Insufficient data for trend analysis' };
    }

    const trends = [];
    for (let i = 1; i < annualStats.length; i++) {
      const prev = annualStats[i - 1];
      const curr = annualStats[i];
      const growth = prev.totalOrders > 0
        ? (((curr.totalOrders - prev.totalOrders) / prev.totalOrders) * 100).toFixed(2)
        : 0;

      trends.push({
        year: curr._id,
        growth: parseFloat(growth),
        orders: curr.totalOrders
      });
    }

    return trends;
  }

  /**
   * Private: Format status breakdown for presentation
   */
  _formatStatusBreakdown(statusData) {
    const total = statusData.reduce((sum, s) => sum + s.count, 0);

    return statusData.map(status => ({
      status: status._id,
      count: status.count,
      percentage: total > 0 ? ((status.count / total) * 100).toFixed(2) : 0
    }));
  }

  /**
   * Private: Apply status filter
   */
  _applyStatusFilter(data, status) {
    // Filter monthly and quarterly data by status
    return {
      ...data,
      monthly: data.monthly.map(m => ({
        ...m,
        totalOrders: status === 'completed' ? m.completed : m.canceled
      })),
      quarterly: data.quarterly.map(q => ({
        ...q,
        totalOrders: status === 'completed' ? q.completed : q.canceled
      }))
    };
  }

  /**
   * Private: Identify overall trend (growing, declining, stable)
   */
  _identifyTrend(yoyGrowth) {
    if (yoyGrowth.length === 0) {
      return 'insufficient_data';
    }

    const avgGrowth = yoyGrowth.reduce((sum, g) => sum + g.growth, 0) / yoyGrowth.length;

    if (avgGrowth > 5) return 'growing';
    if (avgGrowth < -5) return 'declining';
    return 'stable';
  }

  /**
   * Private: Find year with highest orders
   */
  _findStrongestYear(annualStats) {
    return annualStats.reduce((max, curr) =>
      curr.totalOrders > max.totalOrders ? curr : max,
      annualStats[0]
    );
  }

  /**
   * Private: Calculate total growth from first to last year
   */
  _calculateTotalGrowth(annualStats) {
    if (annualStats.length < 2) {
      return 0;
    }

    const first = annualStats[0];
    const last = annualStats[annualStats.length - 1];

    return first.totalOrders > 0
      ? (((last.totalOrders - first.totalOrders) / first.totalOrders) * 100).toFixed(2)
      : 0;
  }

  /**
   * Private: Compare quarters between two years
   */
  _compareQuarters(year1Data, year2Data) {
    const comparison = [];

    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
      const y1 = year1Data.find(q => q._id === quarter);
      const y2 = year2Data.find(q => q._id === quarter);

      if (y1 && y2) {
        const growth = y1.totalOrders > 0
          ? (((y2.totalOrders - y1.totalOrders) / y1.totalOrders) * 100).toFixed(2)
          : 0;

        comparison.push({
          quarter,
          year1Orders: y1.totalOrders,
          year2Orders: y2.totalOrders,
          growth: parseFloat(growth),
          absolute: y2.totalOrders - y1.totalOrders
        });
      }
    });

    return comparison;
  }

  /**
   * Private: Get month name from number
   */
  _getMonthName(monthNumber) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  }

  /**
   * Private: Calculate average of array
   */
  _calculateAverage(numbers) {
    return numbers.length > 0
      ? Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length)
      : 0;
  }
}

module.exports = OrderService;
