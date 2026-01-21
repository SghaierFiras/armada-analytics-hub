require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function geographicalAnalysisV2() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    const ordersCollection = database.collection('orders');
    const deliveryTripsCollection = database.collection('deliverytrips');
    const branchesCollection = database.collection('branches');
    const merchantsCollection = database.collection('merchants');

    // Date ranges
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');

    console.log('🌍 GEOGRAPHICAL ANALYSIS BY BRANCH LOCATION (2024-2025)\n');
    console.log('='.repeat(140));

    // Check what fields exist in orders
    console.log('\n⏳ Inspecting order data structure...');
    const sampleOrder = await ordersCollection.findOne({ createdAt: { $gte: startOf2025 } });
    if (sampleOrder) {
      console.log('Available fields:', Object.keys(sampleOrder).slice(0, 20).join(', '));
    }

    // Aggregate by branch directly
    console.log('\n⏳ Aggregating orders by branch (2025)...');
    const ordersByBranch2025 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$branch',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$total', 0] } },
          avgOrderValue: { $avg: { $ifNull: ['$total', 0] } }
        }
      },
      {
        $sort: { totalOrders: -1 }
      },
      {
        $limit: 100
      }
    ]).toArray();

    console.log(`✅ Found ${ordersByBranch2025.length} branches with orders in 2025`);

    // Aggregate by branch for 2024
    console.log('⏳ Aggregating orders by branch (2024)...');
    const ordersByBranch2024 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2024, $lte: endOf2024 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$branch',
          totalOrders2024: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log(`✅ Found ${ordersByBranch2024.length} branches with orders in 2024`);

    // Aggregate delivery trips by branch
    console.log('⏳ Aggregating delivery trips by branch (2025)...');
    const tripsByBranch2025 = await deliveryTripsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$branch',
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    console.log(`✅ Found ${tripsByBranch2025.length} branches with delivery trips`);

    // Build comprehensive branch data
    console.log('\n⏳ Building comprehensive branch data...');
    const branchDataMap = new Map();

    // Add 2025 orders
    ordersByBranch2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        branchDataMap.set(key, {
          branchId: item._id,
          branchName: null,
          merchantId: null,
          merchantName: null,
          orders2025: item.totalOrders,
          revenue2025: item.totalRevenue,
          avgOrderValue2025: item.avgOrderValue,
          orders2024: 0,
          trips2025: 0,
          completedTrips2025: 0,
          canceledTrips2025: 0
        });
      }
    });

    // Add 2024 orders
    ordersByBranch2024.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (branchDataMap.has(key)) {
          branchDataMap.get(key).orders2024 = item.totalOrders2024;
        }
      }
    });

    // Add trip data
    tripsByBranch2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (branchDataMap.has(key)) {
          const data = branchDataMap.get(key);
          data.trips2025 = item.totalTrips;
          data.completedTrips2025 = item.completedTrips;
          data.canceledTrips2025 = item.canceledTrips;
        }
      }
    });

    // Fetch branch details
    console.log('⏳ Fetching branch and merchant details...');
    const branchIds = Array.from(branchDataMap.keys()).map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(id => id !== null);

    const branches = await branchesCollection.find({
      _id: { $in: branchIds }
    }).toArray();

    branches.forEach(branch => {
      const key = branch._id.toString();
      if (branchDataMap.has(key)) {
        const data = branchDataMap.get(key);
        data.branchName = branch.name || 'Unknown';
        data.merchantId = branch.merchant;
      }
    });

    // Fetch merchant names
    const merchantIds = Array.from(branchDataMap.values())
      .filter(b => b.merchantId)
      .map(b => b.merchantId)
      .filter((id, index, self) => self.indexOf(id) === index);

    const merchants = await merchantsCollection.find({
      _id: { $in: merchantIds }
    }).toArray();

    const merchantMap = new Map();
    merchants.forEach(m => {
      merchantMap.set(m._id.toString(), m.name || m.legalName || 'Unknown');
    });

    // Enrich with merchant names
    for (const [key, data] of branchDataMap.entries()) {
      if (data.merchantId) {
        const merchantKey = data.merchantId.toString();
        data.merchantName = merchantMap.get(merchantKey) || 'Unknown';
      }
    }

    // Convert to array and calculate metrics
    const branchData = Array.from(branchDataMap.values()).map(b => {
      const orderGrowth = b.orders2024 > 0
        ? ((b.orders2025 - b.orders2024) / b.orders2024 * 100)
        : (b.orders2024 === 0 && b.orders2025 > 0 ? 100 : 0);

      const completionRate2025 = b.trips2025 > 0
        ? (b.completedTrips2025 / b.trips2025 * 100)
        : 0;

      return {
        ...b,
        orderGrowth,
        completionRate2025
      };
    });

    console.log('✅ Data enrichment complete\n');

    // Sort by orders
    branchData.sort((a, b) => b.orders2025 - a.orders2025);

    // ============ TOP BRANCHES ============
    console.log('='.repeat(140));
    console.log('\n🏢 TOP 50 BRANCHES BY ORDER VOLUME (2025)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Branch Name'.padEnd(30) +
      'Merchant'.padEnd(25) +
      'Orders 25'.padStart(12) +
      'Orders 24'.padStart(12) +
      'Growth%'.padStart(10) +
      'Trips'.padStart(11) +
      'Compl%'.padStart(10)
    );
    console.log('─'.repeat(140));

    branchData.slice(0, 50).forEach((b, index) => {
      const growthSymbol = b.orderGrowth >= 0 ? '+' : '';
      const branchName = b.branchName.substring(0, 28);
      const merchantName = (b.merchantName || 'Unknown').substring(0, 23);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${branchName.padEnd(30)} ` +
        `${merchantName.padEnd(25)} ` +
        `${b.orders2025.toLocaleString().padStart(12)} ` +
        `${b.orders2024.toLocaleString().padStart(12)} ` +
        `${(growthSymbol + b.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
        `${b.trips2025.toLocaleString().padStart(11)} ` +
        `${(b.completionRate2025.toFixed(1) + '%').padStart(10)}`
      );
    });

    // ============ BY MERCHANT ============
    console.log('\n\n📊 PERFORMANCE BY MERCHANT (Aggregated from Branches)\n');
    console.log('─'.repeat(140));

    const merchantStats = new Map();

    branchData.forEach(b => {
      const merchantName = b.merchantName || 'Unknown';
      if (!merchantStats.has(merchantName)) {
        merchantStats.set(merchantName, {
          merchantName,
          branches: 0,
          orders2025: 0,
          orders2024: 0,
          trips2025: 0,
          completedTrips2025: 0,
          canceledTrips2025: 0,
          revenue2025: 0
        });
      }

      const stats = merchantStats.get(merchantName);
      stats.branches++;
      stats.orders2025 += b.orders2025;
      stats.orders2024 += b.orders2024;
      stats.trips2025 += b.trips2025;
      stats.completedTrips2025 += b.completedTrips2025;
      stats.canceledTrips2025 += b.canceledTrips2025;
      stats.revenue2025 += b.revenue2025 || 0;
    });

    const merchantArray = Array.from(merchantStats.values()).map(m => {
      const growth = m.orders2024 > 0
        ? ((m.orders2025 - m.orders2024) / m.orders2024 * 100)
        : 0;

      const completionRate = m.trips2025 > 0
        ? (m.completedTrips2025 / m.trips2025 * 100)
        : 0;

      const avgOrdersPerBranch = m.branches > 0
        ? (m.orders2025 / m.branches)
        : 0;

      return {
        ...m,
        growth,
        completionRate,
        avgOrdersPerBranch
      };
    }).sort((a, b) => b.orders2025 - a.orders2025).slice(0, 30);

    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Branches'.padStart(10) +
      'Orders 2025'.padStart(13) +
      'Growth%'.padStart(10) +
      'Avg/Branch'.padStart(12) +
      'Compl Rate'.padStart(12)
    );
    console.log('─'.repeat(140));

    merchantArray.forEach((m, index) => {
      const growthSymbol = m.growth >= 0 ? '+' : '';
      const merchantName = m.merchantName.substring(0, 28);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${merchantName.padEnd(30)} ` +
        `${m.branches.toString().padStart(10)} ` +
        `${m.orders2025.toLocaleString().padStart(13)} ` +
        `${(growthSymbol + m.growth.toFixed(1) + '%').padStart(10)} ` +
        `${m.avgOrdersPerBranch.toFixed(0).padStart(12)} ` +
        `${(m.completionRate.toFixed(1) + '%').padStart(12)}`
      );
    });

    // ============ FASTEST GROWING BRANCHES ============
    console.log('\n\n🚀 FASTEST GROWING BRANCHES (>100% Growth, Min 500 Orders)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Branch Name'.padEnd(30) +
      'Merchant'.padEnd(25) +
      'Orders 24'.padStart(12) +
      'Orders 25'.padStart(12) +
      'Growth%'.padStart(10)
    );
    console.log('─'.repeat(140));

    const fastGrowing = branchData
      .filter(b => b.orderGrowth > 100 && b.orders2025 >= 500 && b.orders2024 > 0)
      .sort((a, b) => b.orderGrowth - a.orderGrowth)
      .slice(0, 20);

    if (fastGrowing.length === 0) {
      console.log('No branches with >100% growth and 500+ orders');
    } else {
      fastGrowing.forEach((b, index) => {
        const branchName = b.branchName.substring(0, 28);
        const merchantName = (b.merchantName || 'Unknown').substring(0, 23);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${branchName.padEnd(30)} ` +
          `${merchantName.padEnd(25)} ` +
          `${b.orders2024.toLocaleString().padStart(12)} ` +
          `${b.orders2025.toLocaleString().padStart(12)} ` +
          `${('+' + b.orderGrowth.toFixed(1) + '%').padStart(10)}`
        );
      });
    }

    // ============ LOW PERFORMING BRANCHES ============
    console.log('\n\n⚠️  BRANCHES WITH LOW COMPLETION RATES (<80%, Min 500 Orders)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Branch Name'.padEnd(30) +
      'Merchant'.padEnd(25) +
      'Orders'.padStart(10) +
      'Trips'.padStart(11) +
      'Rate'.padStart(10)
    );
    console.log('─'.repeat(140));

    const lowPerforming = branchData
      .filter(b => b.trips2025 > 0 && b.completionRate2025 < 80 && b.orders2025 >= 500)
      .sort((a, b) => a.completionRate2025 - b.completionRate2025)
      .slice(0, 20);

    if (lowPerforming.length === 0) {
      console.log('✅ No branches with <80% completion rate!');
    } else {
      lowPerforming.forEach((b, index) => {
        const branchName = b.branchName.substring(0, 28);
        const merchantName = (b.merchantName || 'Unknown').substring(0, 23);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${branchName.padEnd(30)} ` +
          `${merchantName.padEnd(25)} ` +
          `${b.orders2025.toLocaleString().padStart(10)} ` +
          `${b.trips2025.toLocaleString().padStart(11)} ` +
          `${(b.completionRate2025.toFixed(1) + '%').padStart(10)}`
        );
      });
    }

    // ============ SUMMARY ============
    console.log('\n\n📊 OVERALL BRANCH STATISTICS\n');
    console.log('─'.repeat(140));

    const totalBranches = branchData.length;
    const totalOrders2025 = branchData.reduce((sum, b) => sum + b.orders2025, 0);
    const totalOrders2024 = branchData.reduce((sum, b) => sum + b.orders2024, 0);
    const totalTrips = branchData.reduce((sum, b) => sum + b.trips2025, 0);
    const totalCompleted = branchData.reduce((sum, b) => sum + b.completedTrips2025, 0);

    const overallGrowth = totalOrders2024 > 0
      ? ((totalOrders2025 - totalOrders2024) / totalOrders2024 * 100).toFixed(2)
      : '0.00';

    const overallCompletionRate = totalTrips > 0
      ? ((totalCompleted / totalTrips) * 100).toFixed(2)
      : '0.00';

    const avgOrdersPerBranch = totalBranches > 0 ? (totalOrders2025 / totalBranches).toFixed(0) : '0';

    console.log(`Total Branches Analyzed:            ${totalBranches.toLocaleString()}`);
    console.log(`Total Orders 2025:                  ${totalOrders2025.toLocaleString()}`);
    console.log(`Total Orders 2024:                  ${totalOrders2024.toLocaleString()}`);
    console.log(`Overall Growth:                     ${overallGrowth >= 0 ? '+' : ''}${overallGrowth}%`);
    console.log(`Total Delivery Trips:               ${totalTrips.toLocaleString()}`);
    console.log(`Overall Completion Rate:            ${overallCompletionRate}%`);
    console.log(`Average Orders per Branch:          ${avgOrdersPerBranch}`);

    // Top branch
    if (branchData.length > 0) {
      const topBranch = branchData[0];
      const topShare = (topBranch.orders2025 / totalOrders2025 * 100).toFixed(1);
      console.log(`\nTop Branch:                         ${topBranch.branchName}`);
      console.log(`  Merchant:                         ${topBranch.merchantName}`);
      console.log(`  Orders:                           ${topBranch.orders2025.toLocaleString()} (${topShare}% of total)`);
      console.log(`  Completion Rate:                  ${topBranch.completionRate2025.toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed');
  }
}

geographicalAnalysisV2();
