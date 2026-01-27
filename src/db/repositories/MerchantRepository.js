const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * Merchant Repository
 * Handles all database operations related to merchants collection and merchant-related queries
 */
class MerchantRepository extends BaseRepository {
  constructor() {
    super('merchants');
  }

  /**
   * Get active merchants by year (merchants with orders in that year)
   * @param {number} year - Year to filter
   * @returns {Promise<Array>} Active merchants
   */
  async getActiveMerchantsByYear(year) {
    // This requires joining with orders collection
    const pipeline = [
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 }
              }
            }
          ],
          as: 'orderStats'
        }
      },
      {
        $match: {
          orderStats: { $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          area: 1,
          governorate: 1,
          totalOrders: { $arrayElemAt: ['$orderStats.totalOrders', 0] }
        }
      }
    ];

    logger.info(`Fetching active merchants for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get merchant profiles with multi-year data
   * @param {number} startYear - Start year
   * @param {number} endYear - End year
   * @returns {Promise<Array>} Merchant profiles
   */
  async getMerchantProfiles(startYear, endYear) {
    const pipeline = [
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${startYear}-01-01`),
                  $lte: new Date(`${endYear}-12-31`)
                }
              }
            },
            {
              $group: {
                _id: {
                  merchant: '$merchant',
                  year: { $year: '$createdAt' }
                },
                orders: { $sum: 1 },
                branches: { $addToSet: '$branch' }
              }
            },
            {
              $project: {
                year: '$_id.year',
                orders: 1,
                branchCount: { $size: '$branches' }
              }
            },
            {
              $sort: { year: 1 }
            }
          ],
          as: 'yearlyStats'
        }
      },
      {
        $match: {
          yearlyStats: { $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          area: 1,
          governorate: 1,
          yearlyStats: 1,
          totalYears: { $size: '$yearlyStats' },
          totalOrders: { $sum: '$yearlyStats.orders' },
          avgAnnualOrders: { $avg: '$yearlyStats.orders' }
        }
      }
    ];

    logger.info(`Fetching merchant profiles from ${startYear} to ${endYear}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get merchants by volume category
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Merchants categorized by size
   */
  async getMerchantsByVolume(year) {
    // First get merchant order counts
    const merchantOrders = await this.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            {
              $count: 'orders'
            }
          ],
          as: 'orderStats'
        }
      },
      {
        $match: {
          orderStats: { $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          orderCount: { $arrayElemAt: ['$orderStats.orders', 0] }
        }
      }
    ]);

    // Categorize merchants
    const categories = {
      micro: { range: '0-100', merchants: [], count: 0 },
      small: { range: '100-1,000', merchants: [], count: 0 },
      medium: { range: '1,000-10,000', merchants: [], count: 0 },
      large: { range: '10,000-50,000', merchants: [], count: 0 },
      enterprise: { range: '50,000+', merchants: [], count: 0 }
    };

    merchantOrders.forEach(merchant => {
      const orders = merchant.orderCount;
      let category;

      if (orders < 100) category = 'micro';
      else if (orders < 1000) category = 'small';
      else if (orders < 10000) category = 'medium';
      else if (orders < 50000) category = 'large';
      else category = 'enterprise';

      categories[category].merchants.push({
        id: merchant._id,
        name: merchant.name,
        orders
      });
      categories[category].count++;
    });

    logger.info(`Categorized ${merchantOrders.length} merchants by volume for year ${year}`);
    return categories;
  }

  /**
   * Get multi-branch merchants
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Merchants with multiple branches
   */
  async getMultiBranchMerchants(year) {
    const pipeline = [
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            {
              $group: {
                _id: '$merchant',
                branches: { $addToSet: '$branch' }
              }
            }
          ],
          as: 'branchData'
        }
      },
      {
        $match: {
          branchData: { $ne: [] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          area: 1,
          branchCount: { $size: { $arrayElemAt: ['$branchData.branches', 0] } }
        }
      },
      {
        $match: {
          branchCount: { $gt: 1 }
        }
      },
      {
        $sort: { branchCount: -1 }
      }
    ];

    logger.info(`Fetching multi-branch merchants for year ${year}`);
    return await this.aggregate(pipeline);
  }

  /**
   * Get merchant growth cohorts (new vs returning)
   * @param {number} year - Current year
   * @returns {Promise<Object>} Growth cohort data
   */
  async getMerchantGrowthCohorts(year) {
    const previousYear = year - 1;

    // Get merchants active in current year
    const currentYearMerchants = await this.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'currentOrders'
        }
      },
      {
        $match: {
          currentOrders: { $ne: [] }
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${previousYear}-01-01`),
                  $lte: new Date(`${previousYear}-12-31`)
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'previousOrders'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isNew: { $eq: ['$previousOrders', []] }
        }
      }
    ]);

    const newMerchants = currentYearMerchants.filter(m => m.isNew);
    const returningMerchants = currentYearMerchants.filter(m => !m.isNew);

    logger.info(`Growth cohorts for ${year}: ${newMerchants.length} new, ${returningMerchants.length} returning`);

    return {
      year,
      total: currentYearMerchants.length,
      new: {
        count: newMerchants.length,
        percentage: ((newMerchants.length / currentYearMerchants.length) * 100).toFixed(2),
        merchants: newMerchants.map(m => ({ id: m._id, name: m.name }))
      },
      returning: {
        count: returningMerchants.length,
        percentage: ((returningMerchants.length / currentYearMerchants.length) * 100).toFixed(2),
        merchants: returningMerchants.map(m => ({ id: m._id, name: m.name }))
      }
    };
  }

  /**
   * Get geographic distribution of merchants
   * @param {number} year - Year to filter (optional)
   * @returns {Promise<Array>} Geographic distribution
   */
  async getGeographicDistribution(year = null) {
    let matchQuery = {};

    if (year) {
      matchQuery = {
        $lookup: {
          from: 'orders',
          let: { merchantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$merchant', '$$merchantId'] },
                createdAt: {
                  $gte: new Date(`${year}-01-01`),
                  $lte: new Date(`${year}-12-31`)
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'yearOrders'
        }
      };
    }

    const pipeline = year ? [matchQuery, { $match: { yearOrders: { $ne: [] } } }] : [];

    pipeline.push(
      {
        $group: {
          _id: {
            governorate: '$governorate',
            area: '$area'
          },
          count: { $sum: 1 },
          merchants: { $push: { id: '$_id', name: '$name' } }
        }
      },
      {
        $group: {
          _id: '$_id.governorate',
          totalMerchants: { $sum: '$count' },
          areas: {
            $push: {
              area: '$_id.area',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { totalMerchants: -1 }
      }
    );

    const yearStr = year ? ` for year ${year}` : ' (all)';
    logger.info(`Fetching geographic distribution${yearStr}`);
    return await this.aggregate(pipeline);
  }
}

module.exports = MerchantRepository;
