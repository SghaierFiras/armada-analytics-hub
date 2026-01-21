require('dotenv').config();
const { MongoClient } = require('mongodb');

async function query2025Stats() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');

    // Define date range for 2025
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');

    console.log('📊 Querying 2025 Statistics...\n');
    console.log(`Date Range: ${startOf2025.toISOString()} to ${endOf2025.toISOString()}\n`);

    // Query 1: Total orders in 2025
    console.log('⏳ Counting orders in 2025...');
    const ordersCollection = database.collection('orders');
    const totalOrders2025 = await ordersCollection.countDocuments({
      createdAt: {
        $gte: startOf2025,
        $lte: endOf2025
      }
    });
    console.log(`✅ Total Orders in 2025: ${totalOrders2025.toLocaleString()}\n`);

    // Query 2: Total delivery trips in 2025
    console.log('⏳ Counting delivery trips in 2025...');
    const deliveryTripsCollection = database.collection('deliverytrips');
    const totalDeliveryTrips2025 = await deliveryTripsCollection.countDocuments({
      createdAt: {
        $gte: startOf2025,
        $lte: endOf2025
      }
    });
    console.log(`✅ Total Delivery Trips in 2025: ${totalDeliveryTrips2025.toLocaleString()}\n`);

    // Query 3: Completed delivery trips in 2025
    console.log('⏳ Counting completed delivery trips in 2025...');
    const completedDeliveryTrips2025 = await deliveryTripsCollection.countDocuments({
      createdAt: {
        $gte: startOf2025,
        $lte: endOf2025
      },
      status: 'completed'
    });
    console.log(`✅ Completed Delivery Trips in 2025: ${completedDeliveryTrips2025.toLocaleString()}\n`);

    // Additional stats
    console.log('📈 Summary:');
    console.log('━'.repeat(50));
    console.log(`Orders in 2025:              ${totalOrders2025.toLocaleString()}`);
    console.log(`Total Delivery Trips:        ${totalDeliveryTrips2025.toLocaleString()}`);
    console.log(`Completed Delivery Trips:    ${completedDeliveryTrips2025.toLocaleString()}`);

    if (totalDeliveryTrips2025 > 0) {
      const completionRate = ((completedDeliveryTrips2025 / totalDeliveryTrips2025) * 100).toFixed(2);
      console.log(`Completion Rate:             ${completionRate}%`);
    }

    // Check what status values exist
    console.log('\n⏳ Checking delivery trip statuses...');
    const statuses = await deliveryTripsCollection.distinct('status', {
      createdAt: {
        $gte: startOf2025,
        $lte: endOf2025
      }
    });
    console.log(`Available statuses: ${statuses.join(', ')}`);

    // Count by status
    console.log('\n📊 Delivery Trips by Status (2025):');
    for (const status of statuses) {
      const count = await deliveryTripsCollection.countDocuments({
        createdAt: {
          $gte: startOf2025,
          $lte: endOf2025
        },
        status: status
      });
      console.log(`   ${status}: ${count.toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

query2025Stats();
