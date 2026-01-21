require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function analyzeMonthlySeasonalPatterns() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('heroku_v801wdr2');

    // Monthly Analysis - 2023-2025
    console.log('\n=== MONTHLY PERFORMANCE ANALYSIS (2023-2025) ===\n');

    const monthlyStats = await db.collection('orders').aggregate([
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
          month: { $month: '$createdAt' },
          quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month', quarter: '$quarter' },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Get delivery trips by month
    const monthlyTrips = await db.collection('deliverytrips').aggregate([
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
          month: { $month: '$createdAt' },
          status: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month', status: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Format monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    monthlyStats.forEach(stat => {
      const key = `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: stat._id.year,
          month: stat._id.month,
          monthName: monthNames[stat._id.month - 1],
          quarter: stat._id.quarter,
          orders: 0,
          trips: 0,
          completed: 0,
          canceled: 0
        };
      }
      monthlyData[key].orders = stat.totalOrders;
    });

    monthlyTrips.forEach(trip => {
      const key = `${trip._id.year}-${String(trip._id.month).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: trip._id.year,
          month: trip._id.month,
          monthName: monthNames[trip._id.month - 1],
          quarter: Math.ceil(trip._id.month / 3),
          orders: 0,
          trips: 0,
          completed: 0,
          canceled: 0
        };
      }

      monthlyData[key].trips += trip.count;
      if (trip._id.status === 'completed') {
        monthlyData[key].completed = trip.count;
      } else if (trip._id.status === 'canceled') {
        monthlyData[key].canceled = trip.count;
      }
    });

    // Calculate completion rates and YoY growth
    const sortedMonths = Object.keys(monthlyData).sort();
    const formattedData = sortedMonths.map((key, index) => {
      const data = monthlyData[key];
      const completionRate = data.trips > 0 ? ((data.completed / data.trips) * 100).toFixed(2) : '0.00';

      // Calculate YoY growth (compare to same month previous year)
      let yoyGrowth = 'N/A';
      const prevYearKey = `${data.year - 1}-${String(data.month).padStart(2, '0')}`;
      if (monthlyData[prevYearKey]) {
        const growthRate = ((data.orders - monthlyData[prevYearKey].orders) / monthlyData[prevYearKey].orders * 100).toFixed(2);
        yoyGrowth = `${growthRate > 0 ? '+' : ''}${growthRate}%`;
      }

      // Calculate MoM growth
      let momGrowth = 'N/A';
      if (index > 0) {
        const prevKey = sortedMonths[index - 1];
        const prevData = monthlyData[prevKey];
        if (prevData && prevData.orders > 0) {
          const growthRate = ((data.orders - prevData.orders) / prevData.orders * 100).toFixed(2);
          momGrowth = `${growthRate > 0 ? '+' : ''}${growthRate}%`;
        }
      }

      return {
        ...data,
        completionRate: `${completionRate}%`,
        yoyGrowth,
        momGrowth
      };
    });

    // Display monthly data by year
    console.log('MONTHLY BREAKDOWN:\n');
    [2023, 2024, 2025].forEach(year => {
      console.log(`\n--- ${year} ---`);
      console.log('Month'.padEnd(8), 'Quarter'.padEnd(8), 'Orders'.padEnd(12), 'Trips'.padEnd(12), 'Completed'.padEnd(12), 'Completion'.padEnd(12), 'YoY Growth'.padEnd(12), 'MoM Growth');
      console.log('-'.repeat(100));

      formattedData.filter(d => d.year === year).forEach(d => {
        console.log(
          d.monthName.padEnd(8),
          `Q${d.quarter}`.padEnd(8),
          d.orders.toLocaleString().padEnd(12),
          d.trips.toLocaleString().padEnd(12),
          d.completed.toLocaleString().padEnd(12),
          d.completionRate.padEnd(12),
          d.yoyGrowth.padEnd(12),
          d.momGrowth
        );
      });
    });

    // Seasonal Analysis
    console.log('\n\n=== SEASONAL ANALYSIS ===\n');

    const seasonalData = {
      2023: { Q1: [], Q2: [], Q3: [], Q4: [] },
      2024: { Q1: [], Q2: [], Q3: [], Q4: [] },
      2025: { Q1: [], Q2: [], Q3: [], Q4: [] }
    };

    formattedData.forEach(d => {
      if (seasonalData[d.year]) {
        seasonalData[d.year][`Q${d.quarter}`].push({
          month: d.monthName,
          orders: d.orders,
          trips: d.trips,
          completed: d.completed,
          completionRate: d.completionRate
        });
      }
    });

    Object.keys(seasonalData).forEach(year => {
      console.log(`\n--- ${year} QUARTERS ---`);
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const months = seasonalData[year][q];
        if (months.length > 0) {
          const totalOrders = months.reduce((sum, m) => sum + m.orders, 0);
          const totalTrips = months.reduce((sum, m) => sum + m.trips, 0);
          const totalCompleted = months.reduce((sum, m) => sum + m.completed, 0);
          const avgCompletion = totalTrips > 0 ? ((totalCompleted / totalTrips) * 100).toFixed(2) : '0.00';

          console.log(`${q}: ${totalOrders.toLocaleString()} orders, ${totalTrips.toLocaleString()} trips, ${avgCompletion}% completion`);
          months.forEach(m => {
            console.log(`  - ${m.month}: ${m.orders.toLocaleString()} orders`);
          });
        }
      });
    });

    // Best/Worst performing months
    console.log('\n\n=== BEST & WORST PERFORMING MONTHS ===\n');

    const sortedByOrders = [...formattedData].sort((a, b) => b.orders - a.orders);
    console.log('\nTOP 10 MONTHS BY ORDER VOLUME:');
    console.log('Rank'.padEnd(6), 'Month'.padEnd(15), 'Orders'.padEnd(12), 'YoY Growth'.padEnd(12), 'Completion');
    console.log('-'.repeat(60));
    sortedByOrders.slice(0, 10).forEach((d, i) => {
      console.log(
        `${i + 1}`.padEnd(6),
        `${d.monthName} ${d.year}`.padEnd(15),
        d.orders.toLocaleString().padEnd(12),
        d.yoyGrowth.padEnd(12),
        d.completionRate
      );
    });

    console.log('\n\nBOTTOM 10 MONTHS BY ORDER VOLUME:');
    console.log('Rank'.padEnd(6), 'Month'.padEnd(15), 'Orders'.padEnd(12), 'YoY Growth'.padEnd(12), 'Completion');
    console.log('-'.repeat(60));
    sortedByOrders.slice(-10).reverse().forEach((d, i) => {
      console.log(
        `${i + 1}`.padEnd(6),
        `${d.monthName} ${d.year}`.padEnd(15),
        d.orders.toLocaleString().padEnd(12),
        d.yoyGrowth.padEnd(12),
        d.completionRate
      );
    });

    // Average performance by month across all years
    console.log('\n\n=== AVERAGE PERFORMANCE BY MONTH (Across All Years) ===\n');

    const monthAverages = {};
    formattedData.forEach(d => {
      if (!monthAverages[d.monthName]) {
        monthAverages[d.monthName] = {
          monthName: d.monthName,
          totalOrders: 0,
          totalTrips: 0,
          totalCompleted: 0,
          count: 0
        };
      }
      monthAverages[d.monthName].totalOrders += d.orders;
      monthAverages[d.monthName].totalTrips += d.trips;
      monthAverages[d.monthName].totalCompleted += d.completed;
      monthAverages[d.monthName].count++;
    });

    const avgByMonth = Object.values(monthAverages).map(m => ({
      month: m.monthName,
      avgOrders: Math.round(m.totalOrders / m.count),
      avgTrips: Math.round(m.totalTrips / m.count),
      avgCompletionRate: ((m.totalCompleted / m.totalTrips) * 100).toFixed(2)
    }));

    console.log('Month'.padEnd(10), 'Avg Orders'.padEnd(15), 'Avg Trips'.padEnd(15), 'Avg Completion');
    console.log('-'.repeat(60));
    monthNames.forEach(month => {
      const data = avgByMonth.find(m => m.month === month);
      if (data) {
        console.log(
          data.month.padEnd(10),
          data.avgOrders.toLocaleString().padEnd(15),
          data.avgTrips.toLocaleString().padEnd(15),
          `${data.avgCompletionRate}%`
        );
      }
    });

    console.log('\n✓ Monthly and seasonal analysis complete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

analyzeMonthlySeasonalPatterns();
