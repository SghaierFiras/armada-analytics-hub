require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function comprehensiveMerchantAnalysis() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('heroku_v801wdr2');

    console.log('\n=== COMPREHENSIVE MERCHANT ANALYSIS (2023-2025) ===\n');

    // ===== 1. MERCHANT PROFILE & BUSINESS SIZE ANALYSIS =====
    console.log('1. MERCHANT PROFILE & BUSINESS SIZE ANALYSIS\n');

    // Get detailed merchant data with order volumes
    const merchantProfiles = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
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
        $group: {
          _id: '$_id.merchant',
          years: {
            $push: {
              year: '$_id.year',
              orders: '$orders',
              branches: '$branches'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'merchants',
          localField: '_id',
          foreignField: '_id',
          as: 'merchantInfo'
        }
      },
      {
        $unwind: { path: '$merchantInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          merchantId: '$_id',
          merchantName: '$merchantInfo.name',
          years: 1,
          totalBranches: {
            $size: {
              $reduce: {
                input: '$years',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this.branches'] }
              }
            }
          }
        }
      }
    ]).toArray();

    // Categorize merchants by size
    const businessSizeCategories = {
      micro: { range: '1-100 orders/year', merchants: [], totalOrders: 0 },
      small: { range: '100-1,000 orders/year', merchants: [], totalOrders: 0 },
      medium: { range: '1,000-10,000 orders/year', merchants: [], totalOrders: 0 },
      large: { range: '10,000-50,000 orders/year', merchants: [], totalOrders: 0 },
      enterprise: { range: '50,000+ orders/year', merchants: [], totalOrders: 0 }
    };

    merchantProfiles.forEach(merchant => {
      const latestYear = merchant.years.reduce((max, y) =>
        y.year > max.year ? y : max, merchant.years[0]);

      const avgAnnualOrders = merchant.years.reduce((sum, y) => sum + y.orders, 0) / merchant.years.length;

      const profile = {
        name: merchant.merchantName || 'Unknown',
        avgOrders: Math.round(avgAnnualOrders),
        branches: merchant.totalBranches,
        years: merchant.years.length
      };

      if (avgAnnualOrders < 100) {
        businessSizeCategories.micro.merchants.push(profile);
        businessSizeCategories.micro.totalOrders += avgAnnualOrders;
      } else if (avgAnnualOrders < 1000) {
        businessSizeCategories.small.merchants.push(profile);
        businessSizeCategories.small.totalOrders += avgAnnualOrders;
      } else if (avgAnnualOrders < 10000) {
        businessSizeCategories.medium.merchants.push(profile);
        businessSizeCategories.medium.totalOrders += avgAnnualOrders;
      } else if (avgAnnualOrders < 50000) {
        businessSizeCategories.large.merchants.push(profile);
        businessSizeCategories.large.totalOrders += avgAnnualOrders;
      } else {
        businessSizeCategories.enterprise.merchants.push(profile);
        businessSizeCategories.enterprise.totalOrders += avgAnnualOrders;
      }
    });

    console.log('BUSINESS SIZE DISTRIBUTION:\n');
    console.log('Category'.padEnd(20), 'Range'.padEnd(30), 'Count'.padEnd(10), 'Avg Orders'.padEnd(15), '% of Total');
    console.log('-'.repeat(85));

    const totalMerchants = merchantProfiles.length;
    Object.entries(businessSizeCategories).forEach(([key, data]) => {
      const pct = ((data.merchants.length / totalMerchants) * 100).toFixed(2);
      const avgOrders = data.merchants.length > 0 ?
        Math.round(data.totalOrders / data.merchants.length) : 0;

      console.log(
        key.toUpperCase().padEnd(20),
        data.range.padEnd(30),
        data.merchants.length.toString().padEnd(10),
        avgOrders.toLocaleString().padEnd(15),
        `${pct}%`
      );
    });

    // ===== 2. MULTI-BRANCH OPERATIONS ANALYSIS =====
    console.log('\n\n2. MULTI-BRANCH OPERATIONS ANALYSIS\n');

    const branchAnalysis = merchantProfiles
      .filter(m => m.totalBranches > 1)
      .map(m => {
        const totalOrders = m.years.reduce((sum, y) => sum + y.orders, 0);
        return {
          name: m.merchantName || 'Unknown',
          branches: m.totalBranches,
          totalOrders,
          avgOrdersPerBranch: Math.round(totalOrders / m.totalBranches),
          years: m.years.length
        };
      })
      .sort((a, b) => b.branches - a.branches)
      .slice(0, 20);

    console.log('TOP 20 MULTI-BRANCH MERCHANTS:\n');
    console.log('Rank'.padEnd(6), 'Merchant'.padEnd(30), 'Branches'.padEnd(12), 'Total Orders'.padEnd(15), 'Avg per Branch');
    console.log('-'.repeat(75));

    branchAnalysis.forEach((m, i) => {
      console.log(
        `${i + 1}`.padEnd(6),
        (m.name.substring(0, 28)).padEnd(30),
        m.branches.toString().padEnd(12),
        m.totalOrders.toLocaleString().padEnd(15),
        m.avgOrdersPerBranch.toLocaleString()
      );
    });

    // ===== 3. GEOGRAPHICAL DISTRIBUTION BY MERCHANT =====
    console.log('\n\n3. GEOGRAPHICAL DISTRIBUTION ANALYSIS\n');

    const geoDistribution = await db.collection('deliverytrips').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
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
            governorate: '$addressInfo.governorate',
            year: { $year: '$createdAt' }
          },
          trips: { $sum: 1 },
          merchants: { $addToSet: '$merchant' },
          branches: { $addToSet: '$branch' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $match: {
          '_id.area': { $ne: null },
          trips: { $gte: 100 }
        }
      },
      {
        $group: {
          _id: {
            area: '$_id.area',
            governorate: '$_id.governorate'
          },
          totalTrips: { $sum: '$trips' },
          totalCompleted: { $sum: '$completed' },
          uniqueMerchants: { $addToSet: '$merchants' },
          uniqueBranches: { $addToSet: '$branches' },
          years: {
            $push: {
              year: '$_id.year',
              trips: '$trips'
            }
          }
        }
      },
      {
        $project: {
          area: '$_id.area',
          governorate: '$_id.governorate',
          totalTrips: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$totalCompleted', '$totalTrips'] },
              100
            ]
          },
          merchantCount: { $size: { $reduce: {
            input: '$uniqueMerchants',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}},
          branchCount: { $size: { $reduce: {
            input: '$uniqueBranches',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}},
          years: 1
        }
      },
      {
        $sort: { totalTrips: -1 }
      },
      {
        $limit: 30
      }
    ]).toArray();

    console.log('TOP 30 AREAS BY DELIVERY ACTIVITY:\n');
    console.log('Rank'.padEnd(6), 'Area'.padEnd(25), 'Governorate'.padEnd(20), 'Trips'.padEnd(12), 'Merchants'.padEnd(12), 'Branches'.padEnd(12), 'Completion');
    console.log('-'.repeat(100));

    geoDistribution.forEach((area, i) => {
      console.log(
        `${i + 1}`.padEnd(6),
        (area.area || 'Unknown').substring(0, 23).padEnd(25),
        (area.governorate || 'Unknown').substring(0, 18).padEnd(20),
        area.totalTrips.toLocaleString().padEnd(12),
        area.merchantCount.toString().padEnd(12),
        area.branchCount.toString().padEnd(12),
        `${area.completionRate.toFixed(2)}%`
      );
    });

    // ===== 4. MERCHANT SUCCESS METRICS =====
    console.log('\n\n4. MERCHANT SUCCESS METRICS (2023-2025)\n');

    const successMetrics = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2025-12-31')
          }
        }
      },
      {
        $group: {
          _id: { merchant: '$merchant', year: { $year: '$createdAt' } },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'deliverytrips',
          let: { merchantId: '$_id.merchant', year: '$_id.year' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$merchant', '$$merchantId'] },
                    { $eq: [{ $year: '$createdAt' }, '$$year'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                trips: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
              }
            }
          ],
          as: 'deliveryStats'
        }
      },
      {
        $unwind: { path: '$deliveryStats', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'merchants',
          localField: '_id.merchant',
          foreignField: '_id',
          as: 'merchantInfo'
        }
      },
      {
        $unwind: { path: '$merchantInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          merchantName: '$merchantInfo.name',
          year: '$_id.year',
          orders: 1,
          trips: { $ifNull: ['$deliveryStats.trips', 0] },
          completed: { $ifNull: ['$deliveryStats.completed', 0] },
          completionRate: {
            $cond: {
              if: { $gt: [{ $ifNull: ['$deliveryStats.trips', 0] }, 0] },
              then: {
                $multiply: [
                  { $divide: [
                    { $ifNull: ['$deliveryStats.completed', 0] },
                    { $ifNull: ['$deliveryStats.trips', 1] }
                  ]},
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.merchant',
          merchantName: { $first: '$merchantName' },
          years: {
            $push: {
              year: '$year',
              orders: '$orders',
              trips: '$trips',
              completed: '$completed',
              completionRate: '$completionRate'
            }
          },
          totalOrders: { $sum: '$orders' },
          avgCompletionRate: { $avg: '$completionRate' }
        }
      },
      {
        $match: {
          totalOrders: { $gte: 1000 }
        }
      },
      {
        $sort: { totalOrders: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray();

    // Calculate growth rates
    const metricsWithGrowth = successMetrics.map(m => {
      const sorted = m.years.sort((a, b) => a.year - b.year);
      let growth = 'N/A';

      if (sorted.length >= 2) {
        const firstYear = sorted[0];
        const lastYear = sorted[sorted.length - 1];
        const growthRate = ((lastYear.orders - firstYear.orders) / firstYear.orders * 100).toFixed(2);
        growth = `${growthRate > 0 ? '+' : ''}${growthRate}%`;
      }

      return {
        name: m.merchantName || 'Unknown',
        totalOrders: m.totalOrders,
        avgCompletion: m.avgCompletionRate.toFixed(2),
        growth,
        years: sorted.length
      };
    });

    console.log('TOP 50 MERCHANTS BY TOTAL VOLUME (2023-2025):\n');
    console.log('Rank'.padEnd(6), 'Merchant'.padEnd(35), 'Total Orders'.padEnd(15), 'Avg Completion'.padEnd(16), '3-Yr Growth');
    console.log('-'.repeat(85));

    metricsWithGrowth.forEach((m, i) => {
      console.log(
        `${i + 1}`.padEnd(6),
        m.name.substring(0, 33).padEnd(35),
        m.totalOrders.toLocaleString().padEnd(15),
        `${m.avgCompletion}%`.padEnd(16),
        m.growth
      );
    });

    // ===== 5. MERCHANT RETENTION & LIFECYCLE =====
    console.log('\n\n5. MERCHANT RETENTION & LIFECYCLE ANALYSIS\n');

    const lifecycleAnalysis = merchantProfiles.reduce((acc, merchant) => {
      const yearCount = merchant.years.length;

      if (!acc[yearCount]) {
        acc[yearCount] = { count: 0, totalOrders: 0 };
      }

      const totalOrders = merchant.years.reduce((sum, y) => sum + y.orders, 0);
      acc[yearCount].count++;
      acc[yearCount].totalOrders += totalOrders;

      return acc;
    }, {});

    console.log('MERCHANT RETENTION BY ACTIVE YEARS:\n');
    console.log('Years Active'.padEnd(15), 'Merchants'.padEnd(15), 'Avg Total Orders'.padEnd(20), 'Retention %');
    console.log('-'.repeat(65));

    [3, 2, 1].forEach(years => {
      if (lifecycleAnalysis[years]) {
        const data = lifecycleAnalysis[years];
        const avgOrders = Math.round(data.totalOrders / data.count);
        const retentionPct = ((data.count / totalMerchants) * 100).toFixed(2);

        console.log(
          `${years} years`.padEnd(15),
          data.count.toLocaleString().padEnd(15),
          avgOrders.toLocaleString().padEnd(20),
          `${retentionPct}%`
        );
      }
    });

    // ===== 6. TOP PERFORMING MERCHANTS BY YEAR =====
    console.log('\n\n6. TOP 10 MERCHANTS BY YEAR\n');

    for (let year = 2023; year <= 2025; year++) {
      const topByYear = merchantProfiles
        .map(m => {
          const yearData = m.years.find(y => y.year === year);
          return {
            name: m.merchantName || 'Unknown',
            orders: yearData ? yearData.orders : 0,
            branches: m.totalBranches
          };
        })
        .filter(m => m.orders > 0)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10);

      console.log(`\n--- TOP 10 MERCHANTS ${year} ---`);
      console.log('Rank'.padEnd(6), 'Merchant'.padEnd(35), 'Orders'.padEnd(15), 'Branches');
      console.log('-'.repeat(65));

      topByYear.forEach((m, i) => {
        console.log(
          `${i + 1}`.padEnd(6),
          m.name.substring(0, 33).padEnd(35),
          m.orders.toLocaleString().padEnd(15),
          m.branches
        );
      });
    }

    console.log('\n✓ Comprehensive merchant analysis complete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

comprehensiveMerchantAnalysis();
