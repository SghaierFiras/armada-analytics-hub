require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function geographicalAnalysis() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    const ordersCollection = database.collection('orders');
    const deliveryTripsCollection = database.collection('deliverytrips');
    const areasCollection = database.collection('areas');
    const addressesCollection = database.collection('addresses');
    const branchesCollection = database.collection('branches');

    // Date ranges
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');

    console.log('🌍 GEOGRAPHICAL ANALYSIS (2024-2025)\n');
    console.log('='.repeat(140));

    // First, let's get a sample order to see available location fields
    console.log('\n⏳ Analyzing order structure...');
    const sampleOrder = await ordersCollection.findOne({
      createdAt: { $gte: startOf2025 }
    });

    if (sampleOrder) {
      console.log('Sample order fields:', Object.keys(sampleOrder).filter(k =>
        k.includes('area') || k.includes('Area') || k.includes('location') ||
        k.includes('Location') || k.includes('address') || k.includes('Address') ||
        k.includes('governorate') || k.includes('Governorate')
      ).join(', '));
    }

    // Get all available areas
    console.log('\n⏳ Loading area data...');
    const areas = await areasCollection.find({ deleted: { $ne: true } }).toArray();
    console.log(`✅ Found ${areas.length} areas in the system`);

    // Build area map
    const areaMap = new Map();
    areas.forEach(area => {
      areaMap.set(area._id.toString(), {
        name: area.value || 'Unknown',
        governorate: area.governorate || 'Unknown'
      });
    });

    // Analyze orders by delivery area (from address)
    console.log('\n⏳ Analyzing orders by delivery area (2025)...');

    // Get sample addresses with area information
    const sampleAddresses = await addressesCollection.find({
      area: { $exists: true, $ne: null },
      deleted: { $ne: true }
    }).limit(5).toArray();

    console.log('Sample address fields:', sampleAddresses.length > 0 ?
      Object.keys(sampleAddresses[0]).join(', ') : 'No addresses found');

    // Aggregate orders by branch location area
    console.log('\n⏳ Aggregating orders by branch area (2025)...');
    const ordersByBranchArea2025 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchData'
        }
      },
      {
        $unwind: { path: '$branchData', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'addresses',
          localField: 'branchData.address',
          foreignField: '_id',
          as: 'addressData'
        }
      },
      {
        $unwind: { path: '$addressData', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$addressData.area',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$total', 0] } },
          avgOrderValue: { $avg: { $ifNull: ['$total', 0] } }
        }
      },
      {
        $sort: { totalOrders: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray();

    console.log(`✅ Found ${ordersByBranchArea2025.length} areas with orders`);

    // Similar for 2024
    console.log('⏳ Aggregating orders by branch area (2024)...');
    const ordersByBranchArea2024 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2024, $lte: endOf2024 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchData'
        }
      },
      {
        $unwind: { path: '$branchData', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'addresses',
          localField: 'branchData.address',
          foreignField: '_id',
          as: 'addressData'
        }
      },
      {
        $unwind: { path: '$addressData', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$addressData.area',
          totalOrders2024: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log(`✅ Found ${ordersByBranchArea2024.length} areas with orders in 2024`);

    // Aggregate delivery trips by area
    console.log('\n⏳ Analyzing delivery trip completion by area (2025)...');
    const tripsByArea2025 = await deliveryTripsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchData'
        }
      },
      {
        $unwind: { path: '$branchData', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'addresses',
          localField: 'branchData.address',
          foreignField: '_id',
          as: 'addressData'
        }
      },
      {
        $unwind: { path: '$addressData', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$addressData.area',
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { totalTrips: -1 }
      }
    ]).toArray();

    console.log(`✅ Found ${tripsByArea2025.length} areas with delivery trips`);

    // Build comprehensive area data
    console.log('\n⏳ Building comprehensive geographical data...');
    const geoDataMap = new Map();

    // Add 2025 orders
    ordersByBranchArea2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        geoDataMap.set(key, {
          areaId: item._id,
          areaName: null,
          governorate: null,
          orders2025: item.totalOrders,
          revenue2025: item.totalRevenue,
          avgOrderValue2025: item.avgOrderValue,
          orders2024: 0,
          trips2025: 0,
          completedTrips2025: 0,
          canceledTrips2025: 0,
          branchCount: 0
        });
      }
    });

    // Add 2024 orders
    ordersByBranchArea2024.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (geoDataMap.has(key)) {
          geoDataMap.get(key).orders2024 = item.totalOrders2024;
        }
      }
    });

    // Add trip data
    tripsByArea2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (geoDataMap.has(key)) {
          const data = geoDataMap.get(key);
          data.trips2025 = item.totalTrips;
          data.completedTrips2025 = item.completedTrips;
          data.canceledTrips2025 = item.canceledTrips;
        }
      }
    });

    // Enrich with area names
    console.log('⏳ Enriching with area names...');
    for (const [key, data] of geoDataMap.entries()) {
      if (areaMap.has(key)) {
        const areaInfo = areaMap.get(key);
        data.areaName = areaInfo.name;
        data.governorate = areaInfo.governorate;
      }
    }

    // Count branches per area
    console.log('⏳ Counting branches per area...');
    const branchCounts = await branchesCollection.aggregate([
      {
        $match: {
          deleted: { $ne: true },
          address: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'addresses',
          localField: 'address',
          foreignField: '_id',
          as: 'addressData'
        }
      },
      {
        $unwind: { path: '$addressData', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$addressData.area',
          branchCount: { $sum: 1 }
        }
      }
    ]).toArray();

    branchCounts.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (geoDataMap.has(key)) {
          geoDataMap.get(key).branchCount = item.branchCount;
        }
      }
    });

    // Convert to array and calculate metrics
    const geoData = Array.from(geoDataMap.values()).map(g => {
      const orderGrowth = g.orders2024 > 0
        ? ((g.orders2025 - g.orders2024) / g.orders2024 * 100)
        : 0;

      const completionRate2025 = g.trips2025 > 0
        ? (g.completedTrips2025 / g.trips2025 * 100)
        : 0;

      const ordersPerBranch = g.branchCount > 0
        ? (g.orders2025 / g.branchCount)
        : 0;

      return {
        ...g,
        orderGrowth,
        completionRate2025,
        ordersPerBranch
      };
    });

    console.log('✅ Data enrichment complete\n');

    // Sort by orders
    geoData.sort((a, b) => b.orders2025 - a.orders2025);

    // Filter out null areas
    const validGeoData = geoData.filter(g => g.areaName);

    // ============ TOP AREAS BY ORDER VOLUME ============
    console.log('='.repeat(140));
    console.log('\n📍 TOP 30 AREAS BY ORDER VOLUME (2025)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Area Name'.padEnd(25) +
      'Governorate'.padEnd(20) +
      'Branches'.padStart(10) +
      'Orders 25'.padStart(12) +
      'Orders 24'.padStart(12) +
      'Growth%'.padStart(10) +
      'Trips'.padStart(11) +
      'Compl%'.padStart(10)
    );
    console.log('─'.repeat(140));

    validGeoData.slice(0, 30).forEach((g, index) => {
      const growthSymbol = g.orderGrowth >= 0 ? '+' : '';
      const areaName = g.areaName.substring(0, 23);
      const gov = (g.governorate || 'Unknown').substring(0, 18);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${areaName.padEnd(25)} ` +
        `${gov.padEnd(20)} ` +
        `${g.branchCount.toString().padStart(10)} ` +
        `${g.orders2025.toLocaleString().padStart(12)} ` +
        `${g.orders2024.toLocaleString().padStart(12)} ` +
        `${(growthSymbol + g.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
        `${g.trips2025.toLocaleString().padStart(11)} ` +
        `${(g.completionRate2025.toFixed(1) + '%').padStart(10)}`
      );
    });

    // ============ AREAS BY GOVERNORATE ============
    console.log('\n\n📊 PERFORMANCE BY GOVERNORATE\n');
    console.log('─'.repeat(140));

    const governorateStats = new Map();

    validGeoData.forEach(g => {
      const gov = g.governorate || 'Unknown';
      if (!governorateStats.has(gov)) {
        governorateStats.set(gov, {
          governorate: gov,
          areas: 0,
          branches: 0,
          orders2025: 0,
          orders2024: 0,
          trips2025: 0,
          completedTrips2025: 0,
          canceledTrips2025: 0,
          revenue2025: 0
        });
      }

      const stats = governorateStats.get(gov);
      stats.areas++;
      stats.branches += g.branchCount;
      stats.orders2025 += g.orders2025;
      stats.orders2024 += g.orders2024;
      stats.trips2025 += g.trips2025;
      stats.completedTrips2025 += g.completedTrips2025;
      stats.canceledTrips2025 += g.canceledTrips2025;
      stats.revenue2025 += g.revenue2025 || 0;
    });

    const govArray = Array.from(governorateStats.values()).map(g => {
      const growth = g.orders2024 > 0
        ? ((g.orders2025 - g.orders2024) / g.orders2024 * 100)
        : 0;

      const completionRate = g.trips2025 > 0
        ? (g.completedTrips2025 / g.trips2025 * 100)
        : 0;

      return {
        ...g,
        growth,
        completionRate
      };
    }).sort((a, b) => b.orders2025 - a.orders2025);

    console.log(
      'Rank  ' +
      'Governorate'.padEnd(25) +
      'Areas'.padStart(8) +
      'Branches'.padStart(10) +
      'Orders 2025'.padStart(13) +
      'Growth%'.padStart(10) +
      'Trips'.padStart(12) +
      'Compl Rate'.padStart(12)
    );
    console.log('─'.repeat(140));

    govArray.forEach((g, index) => {
      const growthSymbol = g.growth >= 0 ? '+' : '';
      const govName = g.governorate.substring(0, 23);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${govName.padEnd(25)} ` +
        `${g.areas.toString().padStart(8)} ` +
        `${g.branches.toLocaleString().padStart(10)} ` +
        `${g.orders2025.toLocaleString().padStart(13)} ` +
        `${(growthSymbol + g.growth.toFixed(1) + '%').padStart(10)} ` +
        `${g.trips2025.toLocaleString().padStart(12)} ` +
        `${(g.completionRate.toFixed(1) + '%').padStart(12)}`
      );
    });

    // ============ FASTEST GROWING AREAS ============
    console.log('\n\n🚀 FASTEST GROWING AREAS (>50% Growth, Min 500 Orders)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Area Name'.padEnd(30) +
      'Orders 2024'.padStart(13) +
      'Orders 2025'.padStart(13) +
      'Growth%'.padStart(10) +
      'Completion'.padStart(12) +
      'Branches'.padStart(10)
    );
    console.log('─'.repeat(140));

    const fastGrowing = validGeoData
      .filter(g => g.orderGrowth > 50 && g.orders2025 >= 500 && g.orders2024 > 0)
      .sort((a, b) => b.orderGrowth - a.orderGrowth)
      .slice(0, 20);

    if (fastGrowing.length === 0) {
      console.log('No areas with >50% growth and 500+ orders');
    } else {
      fastGrowing.forEach((g, index) => {
        const areaName = g.areaName.substring(0, 28);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${areaName.padEnd(30)} ` +
          `${g.orders2024.toLocaleString().padStart(13)} ` +
          `${g.orders2025.toLocaleString().padStart(13)} ` +
          `${('+' + g.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
          `${(g.completionRate2025.toFixed(1) + '%').padStart(12)} ` +
          `${g.branchCount.toString().padStart(10)}`
        );
      });
    }

    // ============ LOW PERFORMING AREAS ============
    console.log('\n\n⚠️  AREAS WITH LOW COMPLETION RATES (<85%, Min 500 Orders)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Area Name'.padEnd(30) +
      'Orders'.padStart(10) +
      'Trips'.padStart(11) +
      'Completed'.padStart(12) +
      'Canceled'.padStart(11) +
      'Rate'.padStart(10)
    );
    console.log('─'.repeat(140));

    const lowPerforming = validGeoData
      .filter(g => g.trips2025 > 0 && g.completionRate2025 < 85 && g.orders2025 >= 500)
      .sort((a, b) => a.completionRate2025 - b.completionRate2025)
      .slice(0, 20);

    if (lowPerforming.length === 0) {
      console.log('✅ No low performing areas!');
    } else {
      lowPerforming.forEach((g, index) => {
        const areaName = g.areaName.substring(0, 28);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${areaName.padEnd(30)} ` +
          `${g.orders2025.toLocaleString().padStart(10)} ` +
          `${g.trips2025.toLocaleString().padStart(11)} ` +
          `${g.completedTrips2025.toLocaleString().padStart(12)} ` +
          `${g.canceledTrips2025.toLocaleString().padStart(11)} ` +
          `${(g.completionRate2025.toFixed(1) + '%').padStart(10)}`
        );
      });
    }

    // ============ MOST EFFICIENT AREAS ============
    console.log('\n\n⭐ MOST EFFICIENT AREAS (Orders per Branch, Min 5 Branches)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Area Name'.padEnd(30) +
      'Branches'.padStart(10) +
      'Orders'.padStart(12) +
      'Orders/Branch'.padStart(15) +
      'Completion'.padStart(12)
    );
    console.log('─'.repeat(140));

    const efficient = validGeoData
      .filter(g => g.branchCount >= 5)
      .sort((a, b) => b.ordersPerBranch - a.ordersPerBranch)
      .slice(0, 20);

    efficient.forEach((g, index) => {
      const areaName = g.areaName.substring(0, 28);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${areaName.padEnd(30)} ` +
        `${g.branchCount.toString().padStart(10)} ` +
        `${g.orders2025.toLocaleString().padStart(12)} ` +
        `${g.ordersPerBranch.toFixed(1).padStart(15)} ` +
        `${(g.completionRate2025.toFixed(1) + '%').padStart(12)}`
      );
    });

    // ============ SUMMARY STATISTICS ============
    console.log('\n\n📊 OVERALL GEOGRAPHICAL STATISTICS\n');
    console.log('─'.repeat(140));

    const totalAreas = validGeoData.length;
    const totalGovernoratesCount = govArray.length;
    const totalOrders2025 = validGeoData.reduce((sum, g) => sum + g.orders2025, 0);
    const totalOrders2024 = validGeoData.reduce((sum, g) => sum + g.orders2024, 0);
    const totalBranches = validGeoData.reduce((sum, g) => sum + g.branchCount, 0);
    const totalTrips = validGeoData.reduce((sum, g) => sum + g.trips2025, 0);
    const totalCompleted = validGeoData.reduce((sum, g) => sum + g.completedTrips2025, 0);

    const overallGrowth = totalOrders2024 > 0
      ? ((totalOrders2025 - totalOrders2024) / totalOrders2024 * 100).toFixed(2)
      : '0.00';

    const overallCompletionRate = totalTrips > 0
      ? ((totalCompleted / totalTrips) * 100).toFixed(2)
      : '0.00';

    const avgOrdersPerArea = totalAreas > 0 ? (totalOrders2025 / totalAreas).toFixed(0) : '0';
    const avgOrdersPerBranch = totalBranches > 0 ? (totalOrders2025 / totalBranches).toFixed(0) : '0';

    console.log(`Total Areas Analyzed:               ${totalAreas.toLocaleString()}`);
    console.log(`Total Governorates:                 ${totalGovernoratesCount}`);
    console.log(`Total Branches:                     ${totalBranches.toLocaleString()}`);
    console.log(`Total Orders 2025:                  ${totalOrders2025.toLocaleString()}`);
    console.log(`Total Orders 2024:                  ${totalOrders2024.toLocaleString()}`);
    console.log(`Overall Growth:                     ${overallGrowth >= 0 ? '+' : ''}${overallGrowth}%`);
    console.log(`Total Delivery Trips:               ${totalTrips.toLocaleString()}`);
    console.log(`Overall Completion Rate:            ${overallCompletionRate}%`);
    console.log(`Average Orders per Area:            ${avgOrdersPerArea}`);
    console.log(`Average Orders per Branch:          ${avgOrdersPerBranch}`);

    // Top governorate
    if (govArray.length > 0) {
      const topGov = govArray[0];
      const topGovShare = (topGov.orders2025 / totalOrders2025 * 100).toFixed(1);
      console.log(`\nTop Governorate:                    ${topGov.governorate}`);
      console.log(`  Orders:                           ${topGov.orders2025.toLocaleString()} (${topGovShare}% of total)`);
      console.log(`  Areas:                            ${topGov.areas}`);
      console.log(`  Branches:                         ${topGov.branches.toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed');
  }
}

geographicalAnalysis();
