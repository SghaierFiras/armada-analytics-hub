const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * Delivery Trip Repository
 * Handles all database operations related to delivery trips collection
 */
class DeliveryTripRepository extends BaseRepository {
  constructor() {
    super('deliverytrips');
  }

  /**
   * Get trips by status
   * @param {number} year - Year to filter
   * @param {string} status - Status filter ('completed', 'canceled', etc.)
   * @returns {Promise<Array>} Trips by status
   */
  async getTripsByStatus(year, status = null) {
    const matchQuery = {
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    };

    if (status) {
      matchQuery.status = status;
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];

    logger.info(`Fetching trips by status for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get completion rates by time period
   * @param {number} year - Year to analyze
   * @param {string} period - 'monthly' or 'quarterly'
   * @returns {Promise<Array>} Completion rate data
   */
  async getCompletionRates(year, period = 'monthly') {
    const timeGroup = period === 'monthly'
      ? { month: { $month: '$createdAt' } }
      : {
          quarter: {
            $concat: [
              'Q',
              {
                $toString: {
                  $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
                }
              }
            ]
          }
        };

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
          _id: timeGroup,
          totalTrips: { $sum: 1 },
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
          period: '$_id',
          totalTrips: 1,
          completed: 1,
          canceled: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTrips', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalTrips'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    logger.info(`Fetching ${period} completion rates for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get trips by area
   * @param {number} year - Year to filter
   * @returns {Promise<Array>} Trips grouped by area
   */
  async getTripsByArea(year) {
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
          totalTrips: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          area: '$_id',
          totalTrips: 1,
          completed: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTrips', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalTrips'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalTrips: -1 } }
    ];

    logger.info(`Fetching trips by area for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get annual trip statistics
   * @param {number} startYear - Start year
   * @param {number} endYear - End year
   * @returns {Promise<Array>} Annual trip stats
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
        $group: {
          _id: { $year: '$createdAt' },
          totalTrips: { $sum: 1 },
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
          year: '$_id',
          totalTrips: 1,
          completed: 1,
          canceled: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTrips', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalTrips'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { 'year': 1 } }
    ];

    logger.info(`Fetching annual trip stats from ${startYear} to ${endYear}`);
    return await this.aggregate(pipeline);
  }
}

module.exports = DeliveryTripRepository;
