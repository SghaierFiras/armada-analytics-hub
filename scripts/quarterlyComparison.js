require('dotenv').config();
const { MongoClient } = require('mongodb');

async function quarterlyComparison() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    const ordersCollection = database.collection('orders');
    const deliveryTripsCollection = database.collection('deliverytrips');

    // Define years to analyze
    const years = [2023, 2024, 2025];

    // Define quarters
    const quarters = [
      { name: 'Q1', months: [1, 2, 3] },
      { name: 'Q2', months: [4, 5, 6] },
      { name: 'Q3', months: [7, 8, 9] },
      { name: 'Q4', months: [10, 11, 12] }
    ];

    console.log('📊 Quarterly Analysis: Orders and Delivery Trips\n');
    console.log('='.repeat(100));

    // Store results for summary
    const results = {};

    for (const year of years) {
      console.log(`\n📅 YEAR ${year}`);
      console.log('─'.repeat(100));

      results[year] = {
        orders: { total: 0, quarters: {} },
        deliveryTrips: { total: 0, completed: 0, canceled: 0, quarters: {} }
      };

      for (const quarter of quarters) {
        const startDate = new Date(`${year}-${quarter.months[0].toString().padStart(2, '0')}-01T00:00:00.000Z`);
        const endMonth = quarter.months[2];
        const lastDay = new Date(year, endMonth, 0).getDate();
        const endDate = new Date(`${year}-${endMonth.toString().padStart(2, '0')}-${lastDay}T23:59:59.999Z`);

        // Count orders
        const ordersCount = await ordersCollection.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate }
        });

        // Count delivery trips
        const totalTrips = await deliveryTripsCollection.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate }
        });

        const completedTrips = await deliveryTripsCollection.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        });

        const canceledTrips = await deliveryTripsCollection.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'canceled'
        });

        const completionRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(2) : '0.00';

        console.log(`\n${quarter.name} (${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { month: 'short' })})`);
        console.log(`  Orders:              ${ordersCount.toLocaleString()}`);
        console.log(`  Delivery Trips:      ${totalTrips.toLocaleString()}`);
        console.log(`  - Completed:         ${completedTrips.toLocaleString()} (${completionRate}%)`);
        console.log(`  - Canceled:          ${canceledTrips.toLocaleString()}`);

        // Store results
        results[year].orders.quarters[quarter.name] = ordersCount;
        results[year].orders.total += ordersCount;
        results[year].deliveryTrips.quarters[quarter.name] = totalTrips;
        results[year].deliveryTrips.total += totalTrips;
        results[year].deliveryTrips.completed += completedTrips;
        results[year].deliveryTrips.canceled += canceledTrips;
      }

      // Year summary
      const yearCompletionRate = results[year].deliveryTrips.total > 0
        ? ((results[year].deliveryTrips.completed / results[year].deliveryTrips.total) * 100).toFixed(2)
        : '0.00';

      console.log(`\n${year} TOTAL:`);
      console.log(`  Orders:              ${results[year].orders.total.toLocaleString()}`);
      console.log(`  Delivery Trips:      ${results[year].deliveryTrips.total.toLocaleString()}`);
      console.log(`  - Completed:         ${results[year].deliveryTrips.completed.toLocaleString()} (${yearCompletionRate}%)`);
      console.log(`  - Canceled:          ${results[year].deliveryTrips.canceled.toLocaleString()}`);
    }

    // Comparative Analysis
    console.log('\n\n📈 COMPARATIVE ANALYSIS');
    console.log('='.repeat(100));

    // Orders comparison table
    console.log('\n📦 ORDERS BY QUARTER:');
    console.log('Quarter    2023           2024           2025           YoY 2024→2025');
    console.log('─'.repeat(100));

    for (const quarter of quarters) {
      const q2023 = results[2023]?.orders.quarters[quarter.name] || 0;
      const q2024 = results[2024]?.orders.quarters[quarter.name] || 0;
      const q2025 = results[2025]?.orders.quarters[quarter.name] || 0;

      const growth2024to2025 = q2024 > 0 ? (((q2025 - q2024) / q2024) * 100).toFixed(2) : 'N/A';
      const growthSymbol = growth2024to2025 !== 'N/A' && parseFloat(growth2024to2025) >= 0 ? '+' : '';

      console.log(
        `${quarter.name.padEnd(10)} ` +
        `${q2023.toLocaleString().padEnd(14)} ` +
        `${q2024.toLocaleString().padEnd(14)} ` +
        `${q2025.toLocaleString().padEnd(14)} ` +
        `${growth2024to2025 !== 'N/A' ? growthSymbol + growth2024to2025 + '%' : 'N/A'}`
      );
    }

    // Annual totals
    const growth2024to2025Orders = results[2024]?.orders.total > 0
      ? (((results[2025].orders.total - results[2024].orders.total) / results[2024].orders.total) * 100).toFixed(2)
      : 'N/A';
    const growthSymbolOrders = growth2024to2025Orders !== 'N/A' && parseFloat(growth2024to2025Orders) >= 0 ? '+' : '';

    console.log('─'.repeat(100));
    console.log(
      `${'TOTAL'.padEnd(10)} ` +
      `${results[2023].orders.total.toLocaleString().padEnd(14)} ` +
      `${results[2024].orders.total.toLocaleString().padEnd(14)} ` +
      `${results[2025].orders.total.toLocaleString().padEnd(14)} ` +
      `${growth2024to2025Orders !== 'N/A' ? growthSymbolOrders + growth2024to2025Orders + '%' : 'N/A'}`
    );

    // Delivery trips comparison table
    console.log('\n\n🚚 DELIVERY TRIPS BY QUARTER:');
    console.log('Quarter    2023           2024           2025           YoY 2024→2025');
    console.log('─'.repeat(100));

    for (const quarter of quarters) {
      const q2023 = results[2023]?.deliveryTrips.quarters[quarter.name] || 0;
      const q2024 = results[2024]?.deliveryTrips.quarters[quarter.name] || 0;
      const q2025 = results[2025]?.deliveryTrips.quarters[quarter.name] || 0;

      const growth2024to2025 = q2024 > 0 ? (((q2025 - q2024) / q2024) * 100).toFixed(2) : 'N/A';
      const growthSymbol = growth2024to2025 !== 'N/A' && parseFloat(growth2024to2025) >= 0 ? '+' : '';

      console.log(
        `${quarter.name.padEnd(10)} ` +
        `${q2023.toLocaleString().padEnd(14)} ` +
        `${q2024.toLocaleString().padEnd(14)} ` +
        `${q2025.toLocaleString().padEnd(14)} ` +
        `${growth2024to2025 !== 'N/A' ? growthSymbol + growth2024to2025 + '%' : 'N/A'}`
      );
    }

    // Annual totals
    const growth2024to2025Trips = results[2024]?.deliveryTrips.total > 0
      ? (((results[2025].deliveryTrips.total - results[2024].deliveryTrips.total) / results[2024].deliveryTrips.total) * 100).toFixed(2)
      : 'N/A';
    const growthSymbolTrips = growth2024to2025Trips !== 'N/A' && parseFloat(growth2024to2025Trips) >= 0 ? '+' : '';

    console.log('─'.repeat(100));
    console.log(
      `${'TOTAL'.padEnd(10)} ` +
      `${results[2023].deliveryTrips.total.toLocaleString().padEnd(14)} ` +
      `${results[2024].deliveryTrips.total.toLocaleString().padEnd(14)} ` +
      `${results[2025].deliveryTrips.total.toLocaleString().padEnd(14)} ` +
      `${growth2024to2025Trips !== 'N/A' ? growthSymbolTrips + growth2024to2025Trips + '%' : 'N/A'}`
    );

    // Completion rates by year
    console.log('\n\n✅ DELIVERY COMPLETION RATES:');
    console.log('Year       Total Trips    Completed      Canceled       Completion Rate');
    console.log('─'.repeat(100));

    for (const year of years) {
      const rate = results[year].deliveryTrips.total > 0
        ? ((results[year].deliveryTrips.completed / results[year].deliveryTrips.total) * 100).toFixed(2)
        : '0.00';

      console.log(
        `${year}       ` +
        `${results[year].deliveryTrips.total.toLocaleString().padEnd(14)} ` +
        `${results[year].deliveryTrips.completed.toLocaleString().padEnd(14)} ` +
        `${results[year].deliveryTrips.canceled.toLocaleString().padEnd(14)} ` +
        `${rate}%`
      );
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed');
  }
}

quarterlyComparison();
