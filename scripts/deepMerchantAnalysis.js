require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function deepMerchantAnalysis() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    const ordersCollection = database.collection('orders');
    const deliveryTripsCollection = database.collection('deliverytrips');
    const merchantsCollection = database.collection('merchants');
    const branchesCollection = database.collection('branches');

    // Date ranges
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');

    console.log('📊 DEEP MERCHANT ANALYSIS (2024-2025 Comparison)\n');
    console.log('='.repeat(140));

    // Aggregate orders by merchant for 2025
    console.log('\n⏳ Aggregating 2025 orders by merchant...');
    const merchantOrders2025 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          merchant: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$merchant',
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

    console.log(`✅ Found ${merchantOrders2025.length} merchants with orders in 2025`);

    // Aggregate orders by merchant for 2024
    console.log('⏳ Aggregating 2024 orders by merchant...');
    const merchantOrders2024 = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2024, $lte: endOf2024 },
          merchant: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$merchant',
          totalOrders2024: { $sum: 1 },
          totalRevenue2024: { $sum: { $ifNull: ['$total', 0] } }
        }
      }
    ]).toArray();

    console.log(`✅ Found ${merchantOrders2024.length} merchants with orders in 2024`);

    // Aggregate delivery trips for 2025
    console.log('⏳ Aggregating 2025 delivery trips by merchant...');
    const merchantTrips2025 = await deliveryTripsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 },
          merchant: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$merchant',
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

    console.log(`✅ Found ${merchantTrips2025.length} merchants with delivery trips in 2025`);

    // Aggregate delivery trips for 2024
    console.log('⏳ Aggregating 2024 delivery trips by merchant...');
    const merchantTrips2024 = await deliveryTripsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2024, $lte: endOf2024 },
          merchant: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$merchant',
          totalTrips2024: { $sum: 1 },
          completedTrips2024: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    console.log(`✅ Found ${merchantTrips2024.length} merchants with delivery trips in 2024`);

    // Build comprehensive merchant map
    console.log('⏳ Building comprehensive merchant data...');
    const merchantMap = new Map();

    // Add 2025 orders
    merchantOrders2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        merchantMap.set(key, {
          merchantId: item._id,
          name: null,
          totalOrders2025: item.totalOrders,
          totalRevenue2025: item.totalRevenue,
          avgOrderValue2025: item.avgOrderValue,
          totalOrders2024: 0,
          totalRevenue2024: 0,
          totalTrips2025: 0,
          completedTrips2025: 0,
          canceledTrips2025: 0,
          totalTrips2024: 0,
          completedTrips2024: 0,
          branchCount: 0
        });
      }
    });

    // Add 2024 orders
    merchantOrders2024.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (merchantMap.has(key)) {
          const merchant = merchantMap.get(key);
          merchant.totalOrders2024 = item.totalOrders2024;
          merchant.totalRevenue2024 = item.totalRevenue2024;
        }
      }
    });

    // Add 2025 trips
    merchantTrips2025.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (merchantMap.has(key)) {
          const merchant = merchantMap.get(key);
          merchant.totalTrips2025 = item.totalTrips;
          merchant.completedTrips2025 = item.completedTrips;
          merchant.canceledTrips2025 = item.canceledTrips;
        }
      }
    });

    // Add 2024 trips
    merchantTrips2024.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (merchantMap.has(key)) {
          const merchant = merchantMap.get(key);
          merchant.totalTrips2024 = item.totalTrips2024;
          merchant.completedTrips2024 = item.completedTrips2024;
        }
      }
    });

    // Fetch merchant details
    console.log('⏳ Fetching merchant names and details...');
    const merchantIds = Array.from(merchantMap.keys()).map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(id => id !== null);

    const merchants = await merchantsCollection.find({
      _id: { $in: merchantIds }
    }).toArray();

    merchants.forEach(merchant => {
      const key = merchant._id.toString();
      if (merchantMap.has(key)) {
        merchantMap.get(key).name = merchant.name || merchant.legalName || 'Unknown';
      }
    });

    // Count branches per merchant
    console.log('⏳ Counting branches per merchant...');
    const branchCounts = await branchesCollection.aggregate([
      {
        $match: {
          merchant: { $in: merchantIds },
          deleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$merchant',
          branchCount: { $sum: 1 }
        }
      }
    ]).toArray();

    branchCounts.forEach(item => {
      const key = item._id.toString();
      if (merchantMap.has(key)) {
        merchantMap.get(key).branchCount = item.branchCount;
      }
    });

    // Convert to array and calculate metrics
    const merchantData = Array.from(merchantMap.values()).map(m => {
      // Growth rates
      const orderGrowth = m.totalOrders2024 > 0
        ? ((m.totalOrders2025 - m.totalOrders2024) / m.totalOrders2024 * 100)
        : 0;

      const revenueGrowth = m.totalRevenue2024 > 0
        ? ((m.totalRevenue2025 - m.totalRevenue2024) / m.totalRevenue2024 * 100)
        : 0;

      // Completion rates
      const completionRate2025 = m.totalTrips2025 > 0
        ? (m.completedTrips2025 / m.totalTrips2025 * 100)
        : 0;

      const completionRate2024 = m.totalTrips2024 > 0
        ? (m.completedTrips2024 / m.totalTrips2024 * 100)
        : 0;

      const completionRateChange = completionRate2024 > 0
        ? (completionRate2025 - completionRate2024)
        : 0;

      return {
        ...m,
        orderGrowth,
        revenueGrowth,
        completionRate2025,
        completionRate2024,
        completionRateChange
      };
    });

    console.log('✅ Data enrichment complete\n');

    // Sort by orders
    merchantData.sort((a, b) => b.totalOrders2025 - a.totalOrders2025);

    // ============ DISPLAY TOP 50 MERCHANTS ============
    console.log('='.repeat(140));
    console.log('\n🏆 TOP 50 MERCHANTS - COMPREHENSIVE ANALYSIS\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Branches'.padStart(10) +
      'Orders 2025'.padStart(13) +
      'Orders 2024'.padStart(13) +
      'Growth%'.padStart(10) +
      'Trips 2025'.padStart(12) +
      'Compl Rate'.padStart(12) +
      'Rate Δ'.padStart(10)
    );
    console.log('─'.repeat(140));

    merchantData.slice(0, 50).forEach((m, index) => {
      const merchantName = m.name ? m.name.substring(0, 28) : 'Unknown';
      const growthSymbol = m.orderGrowth >= 0 ? '+' : '';
      const rateChangeSymbol = m.completionRateChange >= 0 ? '+' : '';

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${merchantName.padEnd(30)} ` +
        `${m.branchCount.toString().padStart(10)} ` +
        `${m.totalOrders2025.toLocaleString().padStart(13)} ` +
        `${m.totalOrders2024.toLocaleString().padStart(13)} ` +
        `${(growthSymbol + m.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
        `${m.totalTrips2025.toLocaleString().padStart(12)} ` +
        `${(m.completionRate2025.toFixed(1) + '%').padStart(12)} ` +
        `${(rateChangeSymbol + m.completionRateChange.toFixed(1) + '%').padStart(10)}`
      );
    });

    // ============ FAST GROWING MERCHANTS ============
    console.log('\n\n🚀 FASTEST GROWING MERCHANTS (>50% Order Growth, Min 1000 Orders in 2025)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Orders 2024'.padStart(13) +
      'Orders 2025'.padStart(13) +
      'Growth%'.padStart(10) +
      'Completion'.padStart(12) +
      'Revenue 2025'.padStart(15)
    );
    console.log('─'.repeat(140));

    const fastGrowing = merchantData
      .filter(m => m.orderGrowth > 50 && m.totalOrders2025 >= 1000 && m.totalOrders2024 > 0)
      .sort((a, b) => b.orderGrowth - a.orderGrowth)
      .slice(0, 20);

    if (fastGrowing.length === 0) {
      console.log('No merchants with >50% growth and 1000+ orders');
    } else {
      fastGrowing.forEach((m, index) => {
        const merchantName = m.name ? m.name.substring(0, 28) : 'Unknown';
        const revenue = m.totalRevenue2025 || 0;

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(30)} ` +
          `${m.totalOrders2024.toLocaleString().padStart(13)} ` +
          `${m.totalOrders2025.toLocaleString().padStart(13)} ` +
          `${('+' + m.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
          `${(m.completionRate2025.toFixed(1) + '%').padStart(12)} ` +
          `${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(15)}`
        );
      });
    }

    // ============ DECLINING MERCHANTS ============
    console.log('\n\n📉 DECLINING MERCHANTS (Negative Growth, Top 20 by 2025 Volume)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Orders 2024'.padStart(13) +
      'Orders 2025'.padStart(13) +
      'Decline%'.padStart(10) +
      'Completion'.padStart(12) +
      'Lost Orders'.padStart(13)
    );
    console.log('─'.repeat(140));

    const declining = merchantData
      .filter(m => m.orderGrowth < 0 && m.totalOrders2024 > 0)
      .sort((a, b) => b.totalOrders2025 - a.totalOrders2025)
      .slice(0, 20);

    if (declining.length === 0) {
      console.log('✅ No declining merchants found!');
    } else {
      declining.forEach((m, index) => {
        const merchantName = m.name ? m.name.substring(0, 28) : 'Unknown';
        const lostOrders = m.totalOrders2024 - m.totalOrders2025;

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(30)} ` +
          `${m.totalOrders2024.toLocaleString().padStart(13)} ` +
          `${m.totalOrders2025.toLocaleString().padStart(13)} ` +
          `${(m.orderGrowth.toFixed(1) + '%').padStart(10)} ` +
          `${(m.completionRate2025.toFixed(1) + '%').padStart(12)} ` +
          `${lostOrders.toLocaleString().padStart(13)}`
        );
      });
    }

    // ============ LOW PERFORMERS ============
    console.log('\n\n⚠️  LOW COMPLETION RATE MERCHANTS (<85%, Min 500 Orders in 2025)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Orders 2025'.padStart(13) +
      'Total Trips'.padStart(13) +
      'Completed'.padStart(12) +
      'Canceled'.padStart(11) +
      'Rate'.padStart(10) +
      'Rate Δ'.padStart(10)
    );
    console.log('─'.repeat(140));

    const lowPerformers = merchantData
      .filter(m => m.totalTrips2025 > 0 && m.completionRate2025 < 85 && m.totalOrders2025 >= 500)
      .sort((a, b) => b.totalOrders2025 - a.totalOrders2025)
      .slice(0, 20);

    if (lowPerformers.length === 0) {
      console.log('✅ No low performing merchants!');
    } else {
      lowPerformers.forEach((m, index) => {
        const merchantName = m.name ? m.name.substring(0, 28) : 'Unknown';
        const rateChangeSymbol = m.completionRateChange >= 0 ? '+' : '';

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(30)} ` +
          `${m.totalOrders2025.toLocaleString().padStart(13)} ` +
          `${m.totalTrips2025.toLocaleString().padStart(13)} ` +
          `${m.completedTrips2025.toLocaleString().padStart(12)} ` +
          `${m.canceledTrips2025.toLocaleString().padStart(11)} ` +
          `${(m.completionRate2025.toFixed(1) + '%').padStart(10)} ` +
          `${(rateChangeSymbol + m.completionRateChange.toFixed(1) + '%').padStart(10)}`
        );
      });
    }

    // ============ EXCELLENCE AWARDS ============
    console.log('\n\n🌟 EXCELLENCE AWARDS (>95% Completion, Min 1000 Orders in 2025)\n');
    console.log('─'.repeat(140));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(30) +
      'Orders 2025'.padStart(13) +
      'Trips'.padStart(12) +
      'Completed'.padStart(12) +
      'Rate'.padStart(10) +
      'Growth%'.padStart(10)
    );
    console.log('─'.repeat(140));

    const excellent = merchantData
      .filter(m => m.completionRate2025 > 95 && m.totalOrders2025 >= 1000 && m.totalTrips2025 >= 100)
      .sort((a, b) => b.totalOrders2025 - a.totalOrders2025)
      .slice(0, 20);

    if (excellent.length === 0) {
      console.log('No merchants found');
    } else {
      excellent.forEach((m, index) => {
        const merchantName = m.name ? m.name.substring(0, 28) : 'Unknown';
        const growthSymbol = m.orderGrowth >= 0 ? '+' : '';

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(30)} ` +
          `${m.totalOrders2025.toLocaleString().padStart(13)} ` +
          `${m.totalTrips2025.toLocaleString().padStart(12)} ` +
          `${m.completedTrips2025.toLocaleString().padStart(12)} ` +
          `${(m.completionRate2025.toFixed(1) + '%').padStart(10)} ` +
          `${(growthSymbol + m.orderGrowth.toFixed(1) + '%').padStart(10)}`
        );
      });
    }

    // ============ SUMMARY STATISTICS ============
    console.log('\n\n📊 OVERALL STATISTICS\n');
    console.log('─'.repeat(140));

    const totalOrders2025 = merchantData.reduce((sum, m) => sum + m.totalOrders2025, 0);
    const totalOrders2024 = merchantData.reduce((sum, m) => sum + m.totalOrders2024, 0);
    const totalRevenue2025 = merchantData.reduce((sum, m) => sum + m.totalRevenue2025, 0);
    const totalTrips2025 = merchantData.reduce((sum, m) => sum + m.totalTrips2025, 0);
    const totalCompleted2025 = merchantData.reduce((sum, m) => sum + m.completedTrips2025, 0);
    const totalCanceled2025 = merchantData.reduce((sum, m) => sum + m.canceledTrips2025, 0);

    const overallGrowth = totalOrders2024 > 0
      ? ((totalOrders2025 - totalOrders2024) / totalOrders2024 * 100).toFixed(2)
      : '0.00';

    const overallCompletionRate = totalTrips2025 > 0
      ? ((totalCompleted2025 / totalTrips2025) * 100).toFixed(2)
      : '0.00';

    const avgOrderValue = totalOrders2025 > 0
      ? (totalRevenue2025 / totalOrders2025).toFixed(2)
      : '0.00';

    console.log(`Total Merchants Analyzed:           ${merchantData.length.toLocaleString()}`);
    console.log(`Total Orders 2025:                  ${totalOrders2025.toLocaleString()}`);
    console.log(`Total Orders 2024:                  ${totalOrders2024.toLocaleString()}`);
    console.log(`Overall Growth:                     ${overallGrowth >= 0 ? '+' : ''}${overallGrowth}%`);
    console.log(`Total Revenue 2025:                 ${totalRevenue2025.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Average Order Value:                ${avgOrderValue}`);
    console.log(`Total Delivery Trips 2025:          ${totalTrips2025.toLocaleString()}`);
    console.log(`Completed Trips:                    ${totalCompleted2025.toLocaleString()}`);
    console.log(`Canceled Trips:                     ${totalCanceled2025.toLocaleString()}`);
    console.log(`Overall Completion Rate:            ${overallCompletionRate}%`);

    // Count merchants by performance
    const growing = merchantData.filter(m => m.orderGrowth > 0 && m.totalOrders2024 > 0).length;
    const declining_count = merchantData.filter(m => m.orderGrowth < 0 && m.totalOrders2024 > 0).length;
    const highPerformers = merchantData.filter(m => m.completionRate2025 >= 95 && m.totalTrips2025 >= 100).length;
    const lowPerformers_count = merchantData.filter(m => m.completionRate2025 < 85 && m.totalTrips2025 >= 100).length;

    console.log(`\nGrowing Merchants (YoY):            ${growing} (${(growing/merchantData.length*100).toFixed(1)}%)`);
    console.log(`Declining Merchants (YoY):          ${declining_count} (${(declining_count/merchantData.length*100).toFixed(1)}%)`);
    console.log(`High Performers (≥95% rate):        ${highPerformers}`);
    console.log(`Low Performers (<85% rate):         ${lowPerformers_count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed');
  }
}

deepMerchantAnalysis();
