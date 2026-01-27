const OrderRepository = require('../db/repositories/OrderRepository');
const MerchantRepository = require('../db/repositories/MerchantRepository');
const DeliveryTripRepository = require('../db/repositories/DeliveryTripRepository');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Geographic Service
 * Business logic for geographic analysis and area-based metrics
 */
class GeographicService {
  constructor() {
    this.orderRepo = new OrderRepository();
    this.merchantRepo = new MerchantRepository();
    this.tripRepo = new DeliveryTripRepository();
  }

  /**
   * Get comprehensive geographic analysis
   * @param {Object} filters - year, area filters
   * @returns {Promise<Object>} Geographic analytics
   */
  async getGeographicAnalysis(filters = {}) {
    const { year = 'all', area = 'all' } = filters;

    logger.info('Fetching geographic analysis', { filters });

    try {
      // Determine year to analyze
      const analysisYear = year === 'all' ? new Date().getFullYear() : parseInt(year);

      // Get order distribution by area
      const ordersByArea = await this.orderRepo.getOrdersByArea(analysisYear);

      // Get merchant distribution
      const merchantsByArea = await this.merchantRepo.getGeographicDistribution(analysisYear);

      // Get trip distribution by area
      const tripsByArea = await this.tripRepo.getTripsByArea(analysisYear);

      // Calculate area statistics
      const areaStats = this._calculateAreaStatistics(
        ordersByArea,
        merchantsByArea,
        tripsByArea
      );

      // Identify top performing areas
      const topAreas = this._identifyTopAreas(areaStats);

      // Calculate market concentration
      const concentration = this._calculateMarketConcentration(ordersByArea);

      const result = {
        year: analysisYear,
        areaStats,
        topAreas,
        concentration,
        totals: {
          orders: ordersByArea.reduce((sum, a) => sum + a.totalOrders, 0),
          merchants: this._countTotalMerchants(merchantsByArea),
          areas: areaStats.length
        },
        filters: { year, area }
      };

      // Apply area filter if specified
      if (area !== 'all') {
        result.areaStats = areaStats.filter(a => a.area === area);
      }

      logger.info('Geographic analysis completed', {
        year: analysisYear,
        areasAnalyzed: areaStats.length,
        filters
      });

      return result;
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get geographic analysis',
        filters
      });
      throw error;
    }
  }

  /**
   * Get area-specific statistics
   * @param {string} area - Area name
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Area statistics
   */
  async getAreaStats(area, year) {
    if (!area) {
      throw new ValidationError('Area name is required');
    }

    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching stats for area: ${area}, year: ${year}`);

    try {
      // Get orders in this area
      const ordersData = await this.orderRepo.getOrdersByArea(year);
      const areaOrders = ordersData.find(o => o._id === area);

      // Get merchants in this area
      const merchantsData = await this.merchantRepo.getGeographicDistribution(year);
      const areaMerchants = merchantsData.find(m =>
        m.areas && m.areas.some(a => a.area === area)
      );

      // Get trips in this area
      const tripsData = await this.tripRepo.getTripsByArea(year);
      const areaTrips = tripsData.find(t => t.area === area);

      // Calculate metrics
      const orders = areaOrders?.totalOrders || 0;
      const merchants = areaMerchants?.areas.find(a => a.area === area)?.count || 0;
      const trips = areaTrips?.totalTrips || 0;

      return {
        area,
        year,
        orders,
        merchants,
        trips,
        ordersPerMerchant: merchants > 0 ? (orders / merchants).toFixed(2) : 0,
        ordersPerTrip: trips > 0 ? (orders / trips).toFixed(2) : 0,
        tripCompletionRate: areaTrips?.completionRate || 0,
        insights: {
          marketSize: this._assessMarketSize(orders),
          merchantDensity: this._assessMerchantDensity(merchants),
          efficiency: this._assessAreaEfficiency(orders, trips)
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get area stats',
        area,
        year
      });
      throw error;
    }
  }

  /**
   * Get governorate statistics
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Governorate statistics
   */
  async getGovernorateStats(year) {
    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Fetching governorate stats for ${year}`);

    try {
      // Get merchant distribution (grouped by governorate)
      const merchantsByGov = await this.merchantRepo.getGeographicDistribution(year);

      // Calculate statistics for each governorate
      const governorateStats = await Promise.all(
        merchantsByGov.map(async (gov) => {
          // Get orders for areas in this governorate
          const areas = gov.areas.map(a => a.area);
          let totalOrders = 0;

          const ordersData = await this.orderRepo.getOrdersByArea(year);
          areas.forEach(area => {
            const areaOrders = ordersData.find(o => o._id === area);
            if (areaOrders) {
              totalOrders += areaOrders.totalOrders;
            }
          });

          return {
            governorate: gov._id,
            merchants: gov.totalMerchants,
            areas: gov.areas.length,
            orders: totalOrders,
            ordersPerMerchant: gov.totalMerchants > 0
              ? (totalOrders / gov.totalMerchants).toFixed(2)
              : 0,
            marketShare: 0 // Will be calculated after
          };
        })
      );

      // Calculate market share
      const totalOrders = governorateStats.reduce((sum, g) => sum + g.orders, 0);
      governorateStats.forEach(gov => {
        gov.marketShare = totalOrders > 0
          ? ((gov.orders / totalOrders) * 100).toFixed(2)
          : 0;
      });

      // Sort by orders
      governorateStats.sort((a, b) => b.orders - a.orders);

      return {
        year,
        governorates: governorateStats,
        totals: {
          governorates: governorateStats.length,
          merchants: governorateStats.reduce((sum, g) => sum + g.merchants, 0),
          areas: governorateStats.reduce((sum, g) => sum + g.areas, 0),
          orders: totalOrders
        },
        insights: {
          topGovernorate: governorateStats[0],
          avgOrdersPerGovernorate: governorateStats.length > 0
            ? Math.round(totalOrders / governorateStats.length)
            : 0
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to get governorate stats',
        year
      });
      throw error;
    }
  }

  /**
   * Compare areas
   * @param {Array} areas - Array of area names
   * @param {number} year - Year to analyze
   * @returns {Promise<Object>} Area comparison
   */
  async compareAreas(areas, year) {
    if (!areas || !Array.isArray(areas) || areas.length < 2) {
      throw new ValidationError('At least 2 areas required for comparison');
    }

    if (!year || isNaN(year)) {
      throw new ValidationError('Valid year is required');
    }

    logger.info(`Comparing ${areas.length} areas for ${year}`);

    try {
      // Get stats for each area
      const areaComparisons = await Promise.all(
        areas.map(area => this.getAreaStats(area, year))
      );

      // Calculate rankings
      const rankings = {
        byOrders: [...areaComparisons].sort((a, b) => b.orders - a.orders),
        byMerchants: [...areaComparisons].sort((a, b) => b.merchants - a.merchants),
        byEfficiency: [...areaComparisons].sort((a, b) =>
          parseFloat(b.ordersPerMerchant) - parseFloat(a.ordersPerMerchant)
        )
      };

      return {
        year,
        areas: areaComparisons,
        rankings,
        insights: {
          leader: rankings.byOrders[0],
          mostEfficient: rankings.byEfficiency[0],
          avgOrders: this._calculateAverage(areaComparisons.map(a => a.orders))
        }
      };
    } catch (error) {
      logger.errorWithContext(error, {
        context: 'Failed to compare areas',
        areas,
        year
      });
      throw error;
    }
  }

  /**
   * Private: Calculate area statistics
   */
  _calculateAreaStatistics(ordersByArea, merchantsByArea, tripsByArea) {
    const stats = [];

    // Create a map of all unique areas
    const allAreas = new Set([
      ...ordersByArea.map(o => o._id),
      ...merchantsByArea.flatMap(m => m.areas.map(a => a.area)),
      ...tripsByArea.map(t => t.area)
    ]);

    allAreas.forEach(area => {
      const orders = ordersByArea.find(o => o._id === area);
      const merchantGov = merchantsByArea.find(m =>
        m.areas && m.areas.some(a => a.area === area)
      );
      const merchants = merchantGov?.areas.find(a => a.area === area);
      const trips = tripsByArea.find(t => t.area === area);

      const orderCount = orders?.totalOrders || 0;
      const merchantCount = merchants?.count || 0;
      const tripCount = trips?.totalTrips || 0;

      stats.push({
        area,
        governorate: merchantGov?._id || 'Unknown',
        orders: orderCount,
        merchants: merchantCount,
        trips: tripCount,
        ordersPerMerchant: merchantCount > 0 ? (orderCount / merchantCount).toFixed(2) : 0,
        ordersPerTrip: tripCount > 0 ? (orderCount / tripCount).toFixed(2) : 0,
        tripCompletionRate: trips?.completionRate || 0
      });
    });

    return stats.sort((a, b) => b.orders - a.orders);
  }

  /**
   * Private: Identify top performing areas
   */
  _identifyTopAreas(areaStats, limit = 10) {
    return {
      byOrders: areaStats.slice(0, limit),
      byMerchants: [...areaStats].sort((a, b) => b.merchants - a.merchants).slice(0, limit),
      byEfficiency: [...areaStats]
        .sort((a, b) => parseFloat(b.ordersPerMerchant) - parseFloat(a.ordersPerMerchant))
        .slice(0, limit)
    };
  }

  /**
   * Private: Calculate market concentration (HHI - Herfindahl-Hirschman Index)
   */
  _calculateMarketConcentration(ordersByArea) {
    const totalOrders = ordersByArea.reduce((sum, a) => sum + a.totalOrders, 0);

    if (totalOrders === 0) {
      return { hhi: 0, concentration: 'N/A' };
    }

    // Calculate market share for each area and HHI
    const hhi = ordersByArea.reduce((sum, area) => {
      const marketShare = (area.totalOrders / totalOrders) * 100;
      return sum + Math.pow(marketShare, 2);
    }, 0);

    let concentration;
    if (hhi < 1500) concentration = 'Low (Competitive)';
    else if (hhi < 2500) concentration = 'Moderate';
    else concentration = 'High (Concentrated)';

    return {
      hhi: Math.round(hhi),
      concentration,
      topAreaShare: totalOrders > 0
        ? ((ordersByArea[0].totalOrders / totalOrders) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Private: Count total merchants from geographic distribution
   */
  _countTotalMerchants(merchantsByArea) {
    return merchantsByArea.reduce((sum, m) => sum + m.totalMerchants, 0);
  }

  /**
   * Private: Assess market size
   */
  _assessMarketSize(orders) {
    if (orders > 10000) return 'Large';
    if (orders > 5000) return 'Medium';
    if (orders > 1000) return 'Small';
    return 'Very Small';
  }

  /**
   * Private: Assess merchant density
   */
  _assessMerchantDensity(merchants) {
    if (merchants > 100) return 'High';
    if (merchants > 50) return 'Medium';
    if (merchants > 10) return 'Low';
    return 'Very Low';
  }

  /**
   * Private: Assess area efficiency
   */
  _assessAreaEfficiency(orders, trips) {
    if (trips === 0) return 'Unknown';
    const ratio = orders / trips;
    if (ratio > 3) return 'High';
    if (ratio > 2) return 'Medium';
    return 'Low';
  }

  /**
   * Private: Calculate average
   */
  _calculateAverage(numbers) {
    return numbers.length > 0
      ? Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length)
      : 0;
  }
}

module.exports = GeographicService;
