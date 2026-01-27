const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * Branch Repository
 * Handles all database operations related to branches collection
 */
class BranchRepository extends BaseRepository {
  constructor() {
    super('branches');
  }

  /**
   * Get branches by merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Array>} Branches for the merchant
   */
  async getBranchesByMerchant(merchantId) {
    const query = { merchant: merchantId };
    logger.info(`Fetching branches for merchant ${merchantId}`);
    return await this.find(query);
  }

  /**
   * Get active branches (branches with orders in specified year)
   * @param {number} year - Year to filter
   * @returns {Promise<Array>} Active branches
   */
  async getActiveBranches(year) {
    const pipeline = [
      {
        $lookup: {
          from: 'orders',
          let: { branchId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$branch', '$$branchId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'orders'
        }
      },
      {
        $match: {
          orders: { $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          merchant: 1,
          area: 1,
          governorate: 1
        }
      }
    ];

    logger.info(`Fetching active branches for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get branches by area
   * @param {string} area - Area name
   * @returns {Promise<Array>} Branches in the area
   */
  async getBranchesByArea(area) {
    const query = { area };
    logger.info(`Fetching branches in area ${area}`);
    return await this.find(query);
  }

  /**
   * Get branch count by merchant
   * @returns {Promise<Array>} Merchant branch counts
   */
  async getBranchCountByMerchant() {
    const pipeline = [
      {
        $group: {
          _id: '$merchant',
          branchCount: { $sum: 1 },
          branches: { $push: { id: '$_id', name: '$name' } }
        }
      },
      { $sort: { branchCount: -1 } }
    ];

    logger.info('Fetching branch counts by merchant');
    return await this.aggregate(pipeline);
  }
}

module.exports = BranchRepository;
