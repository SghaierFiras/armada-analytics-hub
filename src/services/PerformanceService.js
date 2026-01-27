const OrderRepository = require('../db/repositories/OrderRepository');
const DeliveryTripRepository = require('../db/repositories/DeliveryTripRepository');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Performance Service
 * Business logic for performance metrics and efficiency analysis
 */
class PerformanceService {
  constructor() {
    this.orderRepo = new OrderRepository();
    this.tripRepo = new DeliveryTripRepository();
  }

  /**
   * Get comprehensive performance metrics
   * @param {Object} filters - year, quarter, month filters
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(filters = {}) {
    const { year = 'all', quarter = 'all', month = 'all' } = filters;

    logger.info('Fetching performance metrics', { filters });

    try {
      // Determine years to analyze
      const years = year === 'all' ? [2023, 2024, 2025] : [parseInt(year)];
      const latestYear = Math.max(...years);

      // Get order metrics
      const orderStats = await this.orderRepo.getAnnualStats(
        Math.min(...years),
        Math.max(...years)
      );

      // Get delivery trip metrics
      const tripStats = await this.tripRepo.getAnnualStats(
        Math.min(...years),
        Math.max(...years)
      );

      // Get completion rates
      const completionRates = await this.getCompletionRates(latestYear);

      // Get efficiency metrics
      const efficiencyMetrics = await this.getEfficiencyMetrics(latestYear);

      // Calculate overall metrics
      const totalOrders = orderStats.reduce((sum, s) => sum + s.totalOrders, 0);
      const totalTrips = tripStats.reduce((sum, s) => sum + s.totalTrips, 0);

      // Apply filters
      let filteredData = {
        totalOrders,
        totalTrips,
        orderStats,
        tripStats,
        completionRates,
        efficiencyMetrics,
        performanceScore: this._calculatePerformanceScore(completionRates, efficiencyMetrics),
        filters: { year, quarter, month }
      };

      logger.info('Performance metrics completed', { totalOrders, totalTrips, filters });

      return filteredData;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get performance metrics',
        filters
      });
      throw error;
    }
  }

  /**
   * Get completion rates analysis
   * @param {number} year - Year to analyze
   * @param {string} period - 'monthly' or 'quarterly'
   * @returns {Promise<Object>} Completion rate data
   */
  async getCompletionRates(year, period = 'monthly') {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching ${period} completion rates for ${year}`);

    try {
      // Get order completion rates
      const orderStats = period === 'monthly'
        ? await this.orderRepo.getMonthlyStats(year)
        : await this.orderRepo.getQuarterlyStats(year);

      // Get trip completion rates
      const tripStats = await this.tripRepo.getCompletionRates(year, period);

      // Calculate combined completion rates
      const combined = this._combineCompletionRates(orderStats, tripStats, period);

      // Calculate overall metrics
      const overallOrderRate = this._calculateOverallRate(orderStats);
      const overallTripRate = this._calculateOverallRate(tripStats);

      return {
        year,
        period,
        orders: {
          byPeriod: orderStats,
          overall: overallOrderRate
        },
        trips: {
          byPeriod: tripStats,
          overall: overallTripRate
        },
        combined,
        insights: {
          bestPeriod: this._findBestPeriod(combined),
          worstPeriod: this._findWorstPeriod(combined),
          trend: this._identifyCompletionTrend(combined)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get completion rates',
        year,
        period
      });
      throw error;
    }
  }

  /**
   * Get efficiency metrics
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Efficiency metrics
   */
  async getEfficiencyMetrics(year) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching efficiency metrics for ${year}`);

    try {
      // Get monthly order and trip data
      const monthlyOrders = await this.orderRepo.getMonthlyStats(year);
      const monthlyTrips = await this.tripRepo.getCompletionRates(year, 'monthly');

      // Calculate orders per trip ratio
      const ordersPerTrip = this._calculateOrdersPerTrip(monthlyOrders, monthlyTrips);

      // Calculate cancellation rate
      const cancellationRate = this._calculateCancellationRate(monthlyOrders);

      // Calculate consistency score
      const consistencyScore = this._calculateConsistencyScore(monthlyOrders);

      return {
        year,
        ordersPerTrip,
        cancellationRate,
        consistencyScore,
        insights: {
          efficiency: this._assessEfficiency(ordersPerTrip),
          reliability: this._assessReliability(cancellationRate),
          stability: this._assessStability(consistencyScore)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get efficiency metrics',
        year
      });
      throw error;
    }
  }

  /**
   * Get growth metrics
   * @param {number} startYear - Start year
   * @param {number} endYear - End year
   * @returns {Promise<Object>} Growth analysis
   */
  async getGrowthMetrics(startYear, endYear) {
    if (!startYear || !endYear || isNaN(startYear) || isNaN(endYear)) {
      throw new ValidationError('Valid start and end years are required');
    }

    logger.info(`Fetching growth metrics from ${startYear} to ${endYear}`);

    try {
      const orderStats = await this.orderRepo.getAnnualStats(startYear, endYear);
      const tripStats = await this.tripRepo.getAnnualStats(startYear, endYear);

      // Calculate year-over-year growth for orders
      const orderGrowth = this._calculateYoYGrowth(orderStats, 'totalOrders');

      // Calculate year-over-year growth for trips
      const tripGrowth = this._calculateYoYGrowth(tripStats, 'totalTrips');

      // Calculate CAGR (Compound Annual Growth Rate)
      const orderCAGR = this._calculateCAGR(orderStats, 'totalOrders');
      const tripCAGR = this._calculateCAGR(tripStats, 'totalTrips');

      return {
        period: { start: startYear, end: endYear },
        orders: {
          annual: orderStats,
          yoyGrowth: orderGrowth,
          cagr: orderCAGR
        },
        trips: {
          annual: tripStats,
          yoyGrowth: tripGrowth,
          cagr: tripCAGR
        },
        insights: {
          fastestGrowingYear: this._findFastestGrowingYear(orderGrowth),
          overallTrend: this._determineOverallTrend(orderGrowth, tripGrowth)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get growth metrics',
        startYear,
        endYear
      });
      throw error;
    }
  }

  /**
   * Private: Calculate performance score
   */
  _calculatePerformanceScore(completionRates, efficiencyMetrics) {
    // Simple scoring: 50% completion rate, 30% efficiency, 20% consistency
    const completionScore = parseFloat(completionRates.orders?.overall?.rate || 0) * 0.5;
    const efficiencyScore = (efficiencyMetrics.ordersPerTrip?.avg || 0) * 5; // Normalize
    const consistencyScore = (efficiencyMetrics.consistencyScore || 0) * 0.2;

    const total = completionScore + Math.min(efficiencyScore, 30) + consistencyScore;

    return {
      score: Math.round(total),
      rating: this._getRating(total),
      breakdown: {
        completion: Math.round(completionScore),
        efficiency: Math.round(Math.min(efficiencyScore, 30)),
        consistency: Math.round(consistencyScore)
      }
    };
  }

  /**
   * Private: Get performance rating
   */
  _getRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Private: Combine order and trip completion rates
   */
  _combineCompletionRates(orderStats, tripStats, period) {
    const combined = [];

    orderStats.forEach(order => {
      const trip = tripStats.find(t => t._id === order._id || t.period?._id === order._id);

      const orderRate = order.totalOrders > 0
        ? ((order.completed / order.totalOrders) * 100).toFixed(2)
        : 0;

      const tripRate = trip && trip.totalTrips > 0
        ? ((trip.completed / trip.totalTrips) * 100).toFixed(2)
        : 0;

      combined.push({
        period: order._id,
        orderCompletionRate: parseFloat(orderRate),
        tripCompletionRate: parseFloat(tripRate),
        avgCompletionRate: ((parseFloat(orderRate) + parseFloat(tripRate)) / 2).toFixed(2)
      });
    });

    return combined;
  }

  /**
   * Private: Calculate overall completion rate
   */
  _calculateOverallRate(stats) {
    const totals = stats.reduce(
      (acc, stat) => ({
        total: acc.total + (stat.totalOrders || stat.totalTrips || 0),
        completed: acc.completed + (stat.completed || 0)
      }),
      { total: 0, completed: 0 }
    );

    return {
      rate: totals.total > 0
        ? ((totals.completed / totals.total) * 100).toFixed(2)
        : 0,
      completed: totals.completed,
      total: totals.total
    };
  }

  /**
   * Private: Find best performing period
   */
  _findBestPeriod(combined) {
    return combined.reduce((best, curr) =>
      parseFloat(curr.avgCompletionRate) > parseFloat(best.avgCompletionRate || 0) ? curr : best,
      {}
    );
  }

  /**
   * Private: Find worst performing period
   */
  _findWorstPeriod(combined) {
    return combined.reduce((worst, curr) =>
      parseFloat(curr.avgCompletionRate) < parseFloat(worst.avgCompletionRate || 100) ? curr : worst,
      {}
    );
  }

  /**
   * Private: Identify completion rate trend
   */
  _identifyCompletionTrend(combined) {
    if (combined.length < 2) return 'insufficient_data';

    const first = parseFloat(combined[0].avgCompletionRate);
    const last = parseFloat(combined[combined.length - 1].avgCompletionRate);

    const change = last - first;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Private: Calculate orders per trip ratio
   */
  _calculateOrdersPerTrip(orders, trips) {
    const totalOrders = orders.reduce((sum, o) => sum + o.totalOrders, 0);
    const totalTrips = trips.reduce((sum, t) => sum + t.totalTrips, 0);

    return {
      avg: totalTrips > 0 ? (totalOrders / totalTrips).toFixed(2) : 0,
      totalOrders,
      totalTrips
    };
  }

  /**
   * Private: Calculate cancellation rate
   */
  _calculateCancellationRate(monthlyOrders) {
    const totals = monthlyOrders.reduce(
      (acc, month) => ({
        total: acc.total + month.totalOrders,
        canceled: acc.canceled + month.canceled
      }),
      { total: 0, canceled: 0 }
    );

    return {
      rate: totals.total > 0
        ? ((totals.canceled / totals.total) * 100).toFixed(2)
        : 0,
      canceled: totals.canceled,
      total: totals.total
    };
  }

  /**
   * Private: Calculate consistency score (lower variance = higher score)
   */
  _calculateConsistencyScore(monthlyOrders) {
    const values = monthlyOrders.map(m => m.totalOrders);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-100 scale (lower std dev = higher score)
    const coefficientOfVariation = avg > 0 ? (stdDev / avg) : 0;
    const score = Math.max(0, 100 - (coefficientOfVariation * 100));

    return parseFloat(score.toFixed(2));
  }

  /**
   * Private: Assess efficiency level
   */
  _assessEfficiency(ordersPerTrip) {
    const ratio = parseFloat(ordersPerTrip.avg);
    if (ratio > 3) return 'High';
    if (ratio > 2) return 'Medium';
    return 'Low';
  }

  /**
   * Private: Assess reliability level
   */
  _assessReliability(cancellationRate) {
    const rate = parseFloat(cancellationRate.rate);
    if (rate < 5) return 'Excellent';
    if (rate < 10) return 'Good';
    if (rate < 20) return 'Fair';
    return 'Poor';
  }

  /**
   * Private: Assess stability level
   */
  _assessStability(consistencyScore) {
    if (consistencyScore > 80) return 'Very Stable';
    if (consistencyScore > 60) return 'Stable';
    if (consistencyScore > 40) return 'Moderate';
    return 'Volatile';
  }

  /**
   * Private: Calculate year-over-year growth
   */
  _calculateYoYGrowth(stats, field) {
    const growth = [];

    for (let i = 1; i < stats.length; i++) {
      const prev = stats[i - 1][field];
      const curr = stats[i][field];
      const rate = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(2) : 0;

      growth.push({
        year: stats[i].year || stats[i]._id,
        growth: parseFloat(rate),
        previous: prev,
        current: curr
      });
    }

    return growth;
  }

  /**
   * Private: Calculate Compound Annual Growth Rate
   */
  _calculateCAGR(stats, field) {
    if (stats.length < 2) return 0;

    const first = stats[0][field];
    const last = stats[stats.length - 1][field];
    const years = stats.length - 1;

    if (first === 0) return 0;

    const cagr = (Math.pow(last / first, 1 / years) - 1) * 100;
    return parseFloat(cagr.toFixed(2));
  }

  /**
   * Private: Find fastest growing year
   */
  _findFastestGrowingYear(growthData) {
    if (growthData.length === 0) return null;

    return growthData.reduce((max, curr) =>
      curr.growth > max.growth ? curr : max,
      growthData[0]
    );
  }

  /**
   * Private: Determine overall trend
   */
  _determineOverallTrend(orderGrowth, tripGrowth) {
    const avgOrderGrowth = orderGrowth.reduce((sum, g) => sum + g.growth, 0) / orderGrowth.length;
    const avgTripGrowth = tripGrowth.reduce((sum, g) => sum + g.growth, 0) / tripGrowth.length;
    const avgGrowth = (avgOrderGrowth + avgTripGrowth) / 2;

    if (avgGrowth > 10) return 'Strong Growth';
    if (avgGrowth > 5) return 'Moderate Growth';
    if (avgGrowth > 0) return 'Slow Growth';
    if (avgGrowth > -5) return 'Slight Decline';
    return 'Declining';
  }
}

module.exports = PerformanceService;
