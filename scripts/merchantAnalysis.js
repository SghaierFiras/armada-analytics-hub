require('dotenv').config();
const { MongoClient } = require('mongodb');

async function merchantAnalysis() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    const ordersCollection = database.collection('orders');
    const deliveryTripsCollection = database.collection('deliverytrips');
    const merchantsCollection = database.collection('merchants');

    // First, get total merchant count
    const totalMerchants = await merchantsCollection.countDocuments({ deleted: { $ne: true } });
    console.log(`📊 Total Active Merchants: ${totalMerchants.toLocaleString()}\n`);

    // Define date range for 2025
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');

    console.log('📈 Analyzing Merchant Performance (2025)...\n');
    console.log('='.repeat(120));

    // Aggregate orders by merchant
    console.log('\n⏳ Aggregating orders by merchant...');
    const merchantOrders = await ordersCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 }
        }
      },
      {
        $group: {
          _id: '$merchant',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$total', 0] } }
        }
      },
      {
        $sort: { totalOrders: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray();

    console.log(`✅ Found ${merchantOrders.length} merchants with orders in 2025\n`);

    // Aggregate delivery trips by merchant
    console.log('⏳ Aggregating delivery trips by merchant...');
    const merchantTrips = await deliveryTripsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startOf2025, $lte: endOf2025 }
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
      },
      {
        $sort: { totalTrips: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray();

    console.log(`✅ Found ${merchantTrips.length} merchants with delivery trips in 2025\n`);

    // Merge data and enrich with merchant names
    console.log('⏳ Enriching data with merchant details...');

    const merchantMap = new Map();

    // Build map from orders
    merchantOrders.forEach(item => {
      if (item._id) {
        merchantMap.set(item._id.toString(), {
          merchantId: item._id,
          totalOrders: item.totalOrders,
          totalRevenue: item.totalRevenue,
          totalTrips: 0,
          completedTrips: 0,
          canceledTrips: 0,
          name: null
        });
      }
    });

    // Add trip data
    merchantTrips.forEach(item => {
      if (item._id) {
        const key = item._id.toString();
        if (merchantMap.has(key)) {
          const merchant = merchantMap.get(key);
          merchant.totalTrips = item.totalTrips;
          merchant.completedTrips = item.completedTrips;
          merchant.canceledTrips = item.canceledTrips;
        } else {
          merchantMap.set(key, {
            merchantId: item._id,
            totalOrders: 0,
            totalRevenue: 0,
            totalTrips: item.totalTrips,
            completedTrips: item.completedTrips,
            canceledTrips: item.canceledTrips,
            name: null
          });
        }
      }
    });

    // Fetch merchant names
    const merchantIds = Array.from(merchantMap.keys()).map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(id => id !== null);

    const { ObjectId } = require('mongodb');

    const merchants = await merchantsCollection.find({
      _id: { $in: merchantIds }
    }).toArray();

    merchants.forEach(merchant => {
      const key = merchant._id.toString();
      if (merchantMap.has(key)) {
        merchantMap.get(key).name = merchant.name || 'Unknown';
      }
    });

    // Convert to array and sort by orders
    const merchantData = Array.from(merchantMap.values())
      .sort((a, b) => b.totalOrders - a.totalOrders);

    // Display Top 30 Merchants
    console.log('✅ Data enrichment complete\n');
    console.log('='.repeat(120));
    console.log('\n🏆 TOP 30 MERCHANTS BY ORDERS (2025)\n');
    console.log('─'.repeat(120));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(35) +
      'Orders'.padStart(12) +
      'Delivery Trips'.padStart(15) +
      'Completed'.padStart(12) +
      'Canceled'.padStart(12) +
      'Rate'.padStart(10)
    );
    console.log('─'.repeat(120));

    merchantData.slice(0, 30).forEach((merchant, index) => {
      const completionRate = merchant.totalTrips > 0
        ? ((merchant.completedTrips / merchant.totalTrips) * 100).toFixed(1)
        : '0.0';

      const merchantName = merchant.name
        ? merchant.name.substring(0, 33)
        : merchant.merchantId.toString().substring(0, 33);

      console.log(
        `${(index + 1).toString().padStart(4)}  ` +
        `${merchantName.padEnd(35)} ` +
        `${merchant.totalOrders.toLocaleString().padStart(12)} ` +
        `${merchant.totalTrips.toLocaleString().padStart(15)} ` +
        `${merchant.completedTrips.toLocaleString().padStart(12)} ` +
        `${merchant.canceledTrips.toLocaleString().padStart(12)} ` +
        `${completionRate.padStart(8)}%`
      );
    });

    // Summary statistics
    console.log('\n\n📊 SUMMARY STATISTICS (2025)\n');
    console.log('─'.repeat(120));

    const totalOrdersAnalyzed = merchantData.reduce((sum, m) => sum + m.totalOrders, 0);
    const totalTripsAnalyzed = merchantData.reduce((sum, m) => sum + m.totalTrips, 0);
    const totalCompletedAnalyzed = merchantData.reduce((sum, m) => sum + m.completedTrips, 0);
    const totalCanceledAnalyzed = merchantData.reduce((sum, m) => sum + m.canceledTrips, 0);
    const overallCompletionRate = totalTripsAnalyzed > 0
      ? ((totalCompletedAnalyzed / totalTripsAnalyzed) * 100).toFixed(2)
      : '0.00';

    console.log(`Total Orders (all merchants):              ${totalOrdersAnalyzed.toLocaleString()}`);
    console.log(`Total Delivery Trips (all merchants):      ${totalTripsAnalyzed.toLocaleString()}`);
    console.log(`Total Completed Trips:                     ${totalCompletedAnalyzed.toLocaleString()}`);
    console.log(`Total Canceled Trips:                      ${totalCanceledAnalyzed.toLocaleString()}`);
    console.log(`Overall Completion Rate:                   ${overallCompletionRate}%`);

    // Top 10 by orders
    const top10Orders = merchantData.slice(0, 10).reduce((sum, m) => sum + m.totalOrders, 0);
    const top10Percentage = (top10Orders / totalOrdersAnalyzed * 100).toFixed(2);

    console.log(`\nTop 10 merchants account for:              ${top10Orders.toLocaleString()} orders (${top10Percentage}% of total)`);

    // Merchants with low completion rates
    console.log('\n\n⚠️  MERCHANTS WITH LOW COMPLETION RATES (<85%) - TOP 20 BY ORDER VOLUME\n');
    console.log('─'.repeat(120));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(35) +
      'Orders'.padStart(12) +
      'Trips'.padStart(12) +
      'Completed'.padStart(12) +
      'Canceled'.padStart(12) +
      'Rate'.padStart(10)
    );
    console.log('─'.repeat(120));

    const lowCompletionMerchants = merchantData
      .filter(m => m.totalTrips > 0 && (m.completedTrips / m.totalTrips) < 0.85)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 20);

    if (lowCompletionMerchants.length === 0) {
      console.log('✅ No merchants with completion rate below 85%');
    } else {
      lowCompletionMerchants.forEach((merchant, index) => {
        const completionRate = merchant.totalTrips > 0
          ? ((merchant.completedTrips / merchant.totalTrips) * 100).toFixed(1)
          : '0.0';

        const merchantName = merchant.name
          ? merchant.name.substring(0, 33)
          : merchant.merchantId.toString().substring(0, 33);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(35)} ` +
          `${merchant.totalOrders.toLocaleString().padStart(12)} ` +
          `${merchant.totalTrips.toLocaleString().padStart(12)} ` +
          `${merchant.completedTrips.toLocaleString().padStart(12)} ` +
          `${merchant.canceledTrips.toLocaleString().padStart(12)} ` +
          `${completionRate.padStart(8)}%`
        );
      });
    }

    // Merchants with excellent completion rates
    console.log('\n\n🌟 MERCHANTS WITH EXCELLENT COMPLETION RATES (>95%) - TOP 20 BY ORDER VOLUME\n');
    console.log('─'.repeat(120));
    console.log(
      'Rank  ' +
      'Merchant Name'.padEnd(35) +
      'Orders'.padStart(12) +
      'Trips'.padStart(12) +
      'Completed'.padStart(12) +
      'Canceled'.padStart(12) +
      'Rate'.padStart(10)
    );
    console.log('─'.repeat(120));

    const highCompletionMerchants = merchantData
      .filter(m => m.totalTrips >= 100 && (m.completedTrips / m.totalTrips) > 0.95)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 20);

    if (highCompletionMerchants.length === 0) {
      console.log('No merchants found with >95% completion rate and 100+ trips');
    } else {
      highCompletionMerchants.forEach((merchant, index) => {
        const completionRate = merchant.totalTrips > 0
          ? ((merchant.completedTrips / merchant.totalTrips) * 100).toFixed(1)
          : '0.0';

        const merchantName = merchant.name
          ? merchant.name.substring(0, 33)
          : merchant.merchantId.toString().substring(0, 33);

        console.log(
          `${(index + 1).toString().padStart(4)}  ` +
          `${merchantName.padEnd(35)} ` +
          `${merchant.totalOrders.toLocaleString().padStart(12)} ` +
          `${merchant.totalTrips.toLocaleString().padStart(12)} ` +
          `${merchant.completedTrips.toLocaleString().padStart(12)} ` +
          `${merchant.canceledTrips.toLocaleString().padStart(12)} ` +
          `${completionRate.padStart(8)}%`
        );
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed');
  }
}

merchantAnalysis();
