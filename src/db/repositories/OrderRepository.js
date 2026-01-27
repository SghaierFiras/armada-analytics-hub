const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * Order Repository
 * Handles all database operations related to orders collection
 */
class OrderRepository extends BaseRepository {
  constructor() {
    super('orders');
  }

  /**
   * Get annual order statistics
   * @param {number} startYear - Start year (e.g., 2023)
   * @param {number} endYear - End year (e.g., 2025)
   * @returns {Promise<Array>} Annual stats grouped by year
   */
  async getAnnualStats(startYear, endYear) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${startYear}-01-01`),
            $lte: new Date(`${endYear}-12-31`)
          }
        }
      },
      {
        $project: {
          year: { $year: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$year',
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    logger.info(`Fetching annual stats from ${startYear} to ${endYear}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get monthly order statistics for a specific year
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Monthly stats
   */
  async getMonthlyStats(year) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $project: {
          month: { $month: '$createdAt' },
          status: 1
        }
      },
      {
        $group: {
          _id: '$month',
          totalOrders: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    logger.info(`Fetching monthly stats for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get quarterly order statistics
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Quarterly stats
   */
  async getQuarterlyStats(year) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $project: {
          quarter: {
            $concat: [
              'Q',
              {
                $toString: {
                  $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
                }
              }
            ]
          },
          status: 1
        }
      },
      {
        $group: {
          _id: '$quarter',
          totalOrders: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    logger.info(`Fetching quarterly stats for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get orders by merchant with aggregated data
   * @param {number} year - Year to filter (optional)
   * @returns {Promise<Array>} Merchant order data
   */
  async getOrdersByMerchant(year = null) {
    const matchStage = year
      ? {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          merchant: { $exists: true }
        }
      : { merchant: { $exists: true } };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$merchant',
          totalOrders: { $sum: 1 },
          branches: { $addToSet: '$branch' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          merchantId: '$_id',
          totalOrders: 1,
          branchCount: { $size: '$branches' },
          completed: 1,
          canceled: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalOrders'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalOrders: -1 } }
    ];

    const yearStr = year ? ` for year ${year}` : ' (all time)';
    logger.info(`Fetching orders by merchant${yearStr}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get top merchants by order volume
   * @param {number} year - Year to filter
   * @param {number} limit - Number of top merchants to return
   * @returns {Promise<Array>} Top merchants
   */
  async getTopMerchants(year, limit = 100) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          merchant: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$merchant',
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: limit }
    ];

    logger.info(`Fetching top ${limit} merchants for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get orders by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters (status, merchant, etc.)
   * @returns {Promise<Array>} Orders in date range
   */
  async getOrdersByDateRange(startDate, endDate, filters = {}) {
    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      ...filters
    };

    logger.info(`Fetching orders from ${startDate} to ${endDate}`);
    return await this.find(query);
  }

  /**
   * Get order statistics by status
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Status breakdown
   */
  async getOrdersByStatus(year) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];

    logger.info(`Fetching order status breakdown for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get orders by area (geographic distribution)
   * @param {number} year - Year to filter
   * @returns {Promise<Array>} Geographic distribution
   */
  async getOrdersByArea(year) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          area: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$area',
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalOrders: -1 } }
    ];

    logger.info(`Fetching orders by area for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get year-over-year comparison
   * @param {number} year1 - First year
   * @param {number} year2 - Second year
   * @returns {Promise<Object>} Comparison data
   */
  async getYearOverYearComparison(year1, year2) {
    const [year1Data] = await this.getAnnualStats(year1, year1);
    const [year2Data] = await this.getAnnualStats(year2, year2);

    const year1Orders = year1Data?.totalOrders || 0;
    const year2Orders = year2Data?.totalOrders || 0;

    const growth = year1Orders > 0
      ? ((year2Orders - year1Orders) / year1Orders) * 100
      : 0;

    logger.info(`Year-over-year comparison: ${year1} vs ${year2}`);

    return {
      [year1]: year1Orders,
      [year2]: year2Orders,
      growth: growth.toFixed(2),
      absolute: year2Orders - year1Orders
    };
  }
}

module.exports = OrderRepository;
