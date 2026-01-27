const BaseRepository = require('./BaseRepository');
const logger = require('../../utils/logger');

/**
 * Address Repository
 * Handles all database operations related to addresses collection
 */
class AddressRepository extends BaseRepository {
  constructor() {
    super('addresses');
  }

  /**
   * Get addresses by area
   * @param {string} area - Area name
   * @returns {Promise<Array>} Addresses in the area
   */
  async getAddressesByArea(area) {
    const query = { area };
    logger.info(`Fetching addresses in area ${area}`);
    return await this.find(query);
  }

  /**
   * Get addresses by governorate
   * @param {string} governorate - Governorate name
   * @returns {Promise<Array>} Addresses in the governorate
   */
  async getAddressesByGovernorate(governorate) {
    const query = { governorate };
    logger.info(`Fetching addresses in governorate ${governorate}`);
    return await this.find(query);
  }

  /**
   * Get geographic distribution
   * @returns {Promise<Array>} Address distribution by area
   */
  async getGeographicDistribution() {
    const pipeline = [
      {
        $group: {
          _id: {
            governorate: '$governorate',
            area: '$area'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.governorate',
          totalAddresses: { $sum: '$count' },
          areas: {
            $push: {
              area: '$_id.area',
              count: '$count'
            }
          }
        }
      },
      { $sort: { totalAddresses: -1 } }
    ];

    logger.info('Fetching geographic distribution of addresses');
    return await this.aggregate(pipeline);
  }
}

module.exports = AddressRepository;
