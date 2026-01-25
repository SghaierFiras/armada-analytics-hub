require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function comprehensiveGlobalAnalysis() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('heroku_v801wdr2');

    console.log('\n=== COMPREHENSIVE GLOBAL PERFORMANCE ANALYSIS ===\n');

    // ===== 1. OVERALL PLATFORM METRICS (2023-2025) =====
    console.log('\n1. OVERALL PLATFORM METRICS (2023-2025)\n');

    const yearlyStats = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
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
    ]).toArray();

    const yearlyTrips = await db.collection('deliverytrips').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $project: {
          year: { $year: '$createdAt' },
          status: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', status: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1 }
      }
    ]).toArray();

    const yearlyMetrics = {};
    yearlyStats.forEach(stat => {
      if (!yearlyMetrics[stat._id]) {
        yearlyMetrics[stat._id] = { year: stat._id, orders: 0, trips: 0, completed: 0, canceled: 0 };
      }
      yearlyMetrics[stat._id].orders = stat.totalOrders;
    });

    yearlyTrips.forEach(trip => {
      if (!yearlyMetrics[trip._id.year]) {
        yearlyMetrics[trip._id.year] = { year: trip._id.year, orders: 0, trips: 0, completed: 0, canceled: 0 };
      }
      yearlyMetrics[trip._id.year].trips += trip.count;
      if (trip._id.status === 'completed') {
        yearlyMetrics[trip._id.year].completed = trip.count;
      } else if (trip._id.status === 'canceled') {
        yearlyMetrics[trip._id.year].canceled = trip.count;
      }
    });

    console.log('Year'.padEnd(8), 'Orders'.padEnd(15), 'Trips'.padEnd(15), 'Completed'.padEnd(15), 'Canceled'.padEnd(15), 'Completion %'.padEnd(15), 'YoY Growth');
    console.log('-'.repeat(110));

    const years = Object.keys(yearlyMetrics).sort();
    years.forEach((year, index) => {
      const metrics = yearlyMetrics[year];
      const completionRate = metrics.trips > 0 ? ((metrics.completed / metrics.trips) * 100).toFixed(2) : '0.00';
      let yoyGrowth = 'N/A';

      if (index > 0) {
        const prevYear = years[index - 1];
        const prevMetrics = yearlyMetrics[prevYear];
        const growth = ((metrics.orders - prevMetrics.orders) / prevMetrics.orders * 100).toFixed(2);
        yoyGrowth = `${growth > 0 ? '+' : ''}${growth}%`;
      }

      console.log(
        year.padEnd(8),
        metrics.orders.toLocaleString().padEnd(15),
        metrics.trips.toLocaleString().padEnd(15),
        metrics.completed.toLocaleString().padEnd(15),
        metrics.canceled.toLocaleString().padEnd(15),
        `${completionRate}%`.padEnd(15),
        yoyGrowth
      );
    });

    // ===== 2. MERCHANT ECOSYSTEM ANALYSIS =====
    console.log('\n\n2. MERCHANT ECOSYSTEM ANALYSIS\n');

    // Total active merchants by year
    const merchantsByYear = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $project: {
          year: { $year: '$createdAt' },
          merchant: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', merchant: '$merchant' }
        }
      },
      {
        $group: {
          _id: '$_id.year',
          uniqueMerchants: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]).toArray();

    console.log('ACTIVE MERCHANTS BY YEAR:\n');
    console.log('Year'.padEnd(10), 'Active Merchants'.padEnd(20), 'YoY Change');
    console.log('-'.repeat(50));

    merchantsByYear.forEach((item, index) => {
      let change = 'N/A';
      if (index > 0) {
        const prev = merchantsByYear[index - 1];
        const diff = item.uniqueMerchants - prev.uniqueMerchants;
        const pct = ((diff / prev.uniqueMerchants) * 100).toFixed(2);
        change = `${diff > 0 ? '+' : ''}${diff} (${pct}%)`;
      }

      console.log(
        item._id.toString().padEnd(10),
        item.uniqueMerchants.toLocaleString().padEnd(20),
        change
      );
    });

    // Merchant distribution by order volume
    console.log('\n\nMERCHANT DISTRIBUTION BY ORDER VOLUME (2025):\n');

    const merchantVolumes2025 = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2025-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $group: {
          _id: '$merchant',
          orderCount: { $sum: 1 }
        }
      },
      {
        $bucket: {
          groupBy: '$orderCount',
          boundaries: [0, 100, 500, 1000, 5000, 10000, 50000, 100000],
          default: 'Above 100k',
          output: {
            count: { $sum: 1 },
            totalOrders: { $sum: '$orderCount' }
          }
        }
      }
    ]).toArray();

    console.log('Volume Range'.padEnd(20), 'Merchants'.padEnd(15), 'Total Orders'.padEnd(20), '% of Total');
    console.log('-'.repeat(70));

    const totalOrdersAll = merchantVolumes2025.reduce((sum, b) => sum + b.totalOrders, 0);
    merchantVolumes2025.forEach(bucket => {
      const rangeLabel = bucket._id === 'Above 100k' ? 'Above 100k' :
        `${bucket._id.toLocaleString()} - ${(parseInt(bucket._id) * 10).toLocaleString()}`;

      const pct = ((bucket.totalOrders / totalOrdersAll) * 100).toFixed(2);

      console.log(
        rangeLabel.padEnd(20),
        bucket.count.toLocaleString().padEnd(15),
        bucket.totalOrders.toLocaleString().padEnd(20),
        `${pct}%`
      );
    });

    // ===== 3. GEOGRAPHICAL DISTRIBUTION =====
    console.log('\n\n3. GEOGRAPHICAL DISTRIBUTION ANALYSIS\n');

    const areaStats2025 = await db.collection('deliverytrips').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2025-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      {
        $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'addresses',
          localField: 'branchInfo.address',
          foreignField: '_id',
          as: 'addressInfo'
        }
      },
      {
        $unwind: { path: '$addressInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            area: '$addressInfo.area',
            governorate: '$addressInfo.governorate'
          },
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
        $match: {
          '_id.area': { $ne: null },
          totalTrips: { $gte: 100 }
        }
      },
      {
        $sort: { totalTrips: -1 }
      },
      {
        $limit: 30
      }
    ]).toArray();

    console.log('TOP 30 AREAS BY DELIVERY VOLUME (2025):\n');
    console.log('Rank'.padEnd(6), 'Area'.padEnd(25), 'Governorate'.padEnd(20), 'Trips'.padEnd(12), 'Completion %');
    console.log('-'.repeat(80));

    areaStats2025.forEach((area, index) => {
      const completionRate = area.totalTrips > 0 ?
        ((area.completed / area.totalTrips) * 100).toFixed(2) : '0.00';

      console.log(
        `${index + 1}`.padEnd(6),
        (area._id.area || 'Unknown').padEnd(25),
        (area._id.governorate || 'Unknown').padEnd(20),
        area.totalTrips.toLocaleString().padEnd(12),
        `${completionRate}%`
      );
    });

    // ===== 4. OPERATIONAL EFFICIENCY =====
    console.log('\n\n4. OPERATIONAL EFFICIENCY METRICS\n');

    // Average orders per merchant
    const avgOrdersPerMerchant = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $project: {
          year: { $year: '$createdAt' },
          merchant: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', merchant: '$merchant' },
          orders: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.year',
          avgOrders: { $avg: '$orders' },
          medianOrders: { $median: { input: '$orders', method: 'approximate' } },
          totalMerchants: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]).toArray();

    console.log('AVERAGE ORDERS PER ACTIVE MERCHANT:\n');
    console.log('Year'.padEnd(10), 'Avg Orders'.padEnd(15), 'Median Orders'.padEnd(15), 'Active Merchants');
    console.log('-'.repeat(60));

    avgOrdersPerMerchant.forEach(stat => {
      console.log(
        stat._id.toString().padEnd(10),
        Math.round(stat.avgOrders).toLocaleString().padEnd(15),
        Math.round(stat.medianOrders).toLocaleString().padEnd(15),
        stat.totalMerchants.toLocaleString()
      );
    });

    // ===== 5. GROWTH COHORT ANALYSIS =====
    console.log('\n\n5. GROWTH COHORT ANALYSIS (2024 vs 2025)\n');

    // Merchant growth cohorts
    const merchantGrowth = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $project: {
          year: { $year: '$createdAt' },
          merchant: 1
        }
      },
      {
        $group: {
          _id: { merchant: '$merchant', year: '$year' },
          orders: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.merchant',
          years: {
            $push: {
              year: '$_id.year',
              orders: '$orders'
            }
          }
        }
      }
    ]).toArray();

    const cohorts = {
      explosive: { count: 0, orders2024: 0, orders2025: 0, label: 'Explosive Growth (>100%)' },
      highGrowth: { count: 0, orders2024: 0, orders2025: 0, label: 'High Growth (50-100%)' },
      moderate: { count: 0, orders2024: 0, orders2025: 0, label: 'Moderate Growth (10-50%)' },
      stable: { count: 0, orders2024: 0, orders2025: 0, label: 'Stable (0-10%)' },
      declining: { count: 0, orders2024: 0, orders2025: 0, label: 'Declining (<0%)' },
      newIn2025: { count: 0, orders2024: 0, orders2025: 0, label: 'New in 2025' },
      churnedIn2025: { count: 0, orders2024: 0, orders2025: 0, label: 'Churned in 2025' }
    };

    merchantGrowth.forEach(merchant => {
      const data2024 = merchant.years.find(y => y.year === 2024);
      const data2025 = merchant.years.find(y => y.year === 2025);

      const orders2024 = data2024 ? data2024.orders : 0;
      const orders2025 = data2025 ? data2025.orders : 0;

      if (orders2024 === 0 && orders2025 > 0) {
        cohorts.newIn2025.count++;
        cohorts.newIn2025.orders2025 += orders2025;
      } else if (orders2024 > 0 && orders2025 === 0) {
        cohorts.churnedIn2025.count++;
        cohorts.churnedIn2025.orders2024 += orders2024;
      } else if (orders2024 > 0 && orders2025 > 0) {
        const growth = ((orders2025 - orders2024) / orders2024) * 100;

        if (growth > 100) {
          cohorts.explosive.count++;
          cohorts.explosive.orders2024 += orders2024;
          cohorts.explosive.orders2025 += orders2025;
        } else if (growth >= 50) {
          cohorts.highGrowth.count++;
          cohorts.highGrowth.orders2024 += orders2024;
          cohorts.highGrowth.orders2025 += orders2025;
        } else if (growth >= 10) {
          cohorts.moderate.count++;
          cohorts.moderate.orders2024 += orders2024;
          cohorts.moderate.orders2025 += orders2025;
        } else if (growth >= 0) {
          cohorts.stable.count++;
          cohorts.stable.orders2024 += orders2024;
          cohorts.stable.orders2025 += orders2025;
        } else {
          cohorts.declining.count++;
          cohorts.declining.orders2024 += orders2024;
          cohorts.declining.orders2025 += orders2025;
        }
      }
    });

    console.log('Cohort'.padEnd(30), 'Merchants'.padEnd(15), 'Orders 2024'.padEnd(15), 'Orders 2025'.padEnd(15), 'Change');
    console.log('-'.repeat(90));

    Object.values(cohorts).forEach(cohort => {
      const change = cohort.orders2024 > 0 ?
        ((cohort.orders2025 - cohort.orders2024) / cohort.orders2024 * 100).toFixed(2) : 'N/A';

      console.log(
        cohort.label.padEnd(30),
        cohort.count.toLocaleString().padEnd(15),
        cohort.orders2024.toLocaleString().padEnd(15),
        cohort.orders2025.toLocaleString().padEnd(15),
        typeof change === 'string' ? change : `${change > 0 ? '+' : ''}${change}%`
      );
    });

    console.log('\n✓ Comprehensive global analysis complete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

comprehensiveGlobalAnalysis();
