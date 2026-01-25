require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = process.env.MONGODB_URI;

async function generateOrderingBehaviorData() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('heroku_v801wdr2');
        const ordersCollection = db.collection('orders');

        // Define time periods
        const timePeriods = [
            { name: 'Breakfast (5:00-9:30 AM)', start: 5, end: 9.5 },
            { name: 'Morning Snack (9:30-11:00 AM)', start: 9.5, end: 11 },
            { name: 'Lunch (11:00 AM-3:00 PM)', start: 11, end: 15 },
            { name: 'Afternoon (3:00-6:30 PM)', start: 15, end: 18.5 },
            { name: 'Dinner (6:30-10:00 PM)', start: 18.5, end: 22 },
            { name: 'Late Night (10:00 PM-5:00 AM)', start: 22, end: 29 } // 22-24 + 0-5
        ];

        console.log('Analyzing ordering behavior for 2025 completed orders...');

        const results = [];
        let totalOrders = 0;
        const periodTotals = {};

        for (const period of timePeriods) {
            console.log(`\nProcessing ${period.name}...`);

            // Build time condition
            const timeCondition = period.start < 22
                ? { $gte: period.start, $lt: period.end }
                : { $or: [
                    { $gte: 22 },
                    { $lt: 5 }
                ]};

            // Get orders for this time period
            const periodOrders = await ordersCollection.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: {
                            $gte: new Date('2025-01-01'),
                            $lt: new Date('2026-01-01')
                        },
                        'delivery.address.governorate': 'kuwait'
                    }
                },
                {
                    $addFields: {
                        hourOfDay: { $hour: { date: '$createdAt', timezone: 'Asia/Kuwait' } }
                    }
                },
                {
                    $match: period.start < 22
                        ? { hourOfDay: timeCondition }
                        : { $or: [{ hourOfDay: { $gte: 22 } }, { hourOfDay: { $lt: 5 } }] }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        avgAmount: { $avg: '$netTotal' }
                    }
                }
            ]).toArray();

            const periodStats = periodOrders[0] || { totalOrders: 0, avgAmount: 0 };
            periodTotals[period.name] = {
                orders: periodStats.totalOrders,
                avgAmount: periodStats.avgAmount || 0
            };
            totalOrders += periodStats.totalOrders;

            // Get top 10 merchants for this period
            const topMerchants = await ordersCollection.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: {
                            $gte: new Date('2025-01-01'),
                            $lt: new Date('2026-01-01')
                        },
                        'delivery.address.governorate': 'kuwait'
                    }
                },
                {
                    $addFields: {
                        hourOfDay: { $hour: { date: '$createdAt', timezone: 'Asia/Kuwait' } }
                    }
                },
                {
                    $match: period.start < 22
                        ? { hourOfDay: timeCondition }
                        : { $or: [{ hourOfDay: { $gte: 22 } }, { hourOfDay: { $lt: 5 } }] }
                },
                {
                    $group: {
                        _id: {
                            merchantId: '$merchant',
                            merchantName: '$merchantName'
                        },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { orderCount: -1 } },
                { $limit: 10 }
            ]).toArray();

            // Add to results
            topMerchants.forEach((merchant, index) => {
                const percentage = ((merchant.orderCount / periodStats.totalOrders) * 100).toFixed(2);
                results.push({
                    timePeriod: period.name,
                    rank: index + 1,
                    merchantName: merchant._id.merchantName || 'Unknown',
                    merchantId: merchant._id.merchantId || 'N/A',
                    orderCount: merchant.orderCount,
                    percentageOfPeriod: percentage,
                    totalPeriodOrders: periodStats.totalOrders,
                    periodPercentOfTotal: 0, // Will calculate after
                    avgOrderAmount: periodStats.avgAmount.toFixed(3)
                });
            });
        }

        // Calculate period percentages of total
        results.forEach(row => {
            const periodOrders = periodTotals[row.timePeriod].orders;
            row.periodPercentOfTotal = ((periodOrders / totalOrders) * 100).toFixed(2);
        });

        // Write to CSV
        const csvHeader = 'Time Period,Rank,Merchant Name,Merchant ID,Order Count,Percentage of Period,Total Period Orders,Period % of Total,Avg Order Amount (KD)\n';
        const csvRows = results.map(r =>
            `${r.timePeriod},${r.rank},${r.merchantName},${r.merchantId},${r.orderCount},${r.percentageOfPeriod},${r.totalPeriodOrders},${r.periodPercentOfTotal},${r.avgOrderAmount}`
        ).join('\n');

        const csvContent = csvHeader + csvRows;
        fs.writeFileSync('data/kuwait_ordering_with_avg_amounts_2025.csv', csvContent);

        console.log(`\n✓ CSV generated successfully!`);
        console.log(`Total orders analyzed: ${totalOrders.toLocaleString()}`);
        console.log(`Total rows in CSV: ${results.length}`);
        console.log(`File saved to: data/kuwait_ordering_with_avg_amounts_2025.csv`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

generateOrderingBehaviorData();
