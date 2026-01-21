require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in .env file');
    console.log('\nPlease create a .env file with your MongoDB connection string:');
    console.log('MONGODB_URI=your_connection_string_here');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();

    console.log('✅ Successfully connected to MongoDB Atlas!\n');

    // List all databases
    const databasesList = await client.db().admin().listDatabases();
    console.log('📊 Available databases:');
    databasesList.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Get cluster info
    const adminDb = client.db('admin');
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    console.log('\n🌐 Cluster information:');
    console.log(`   - MongoDB Version: ${serverStatus.version}`);
    console.log(`   - Host: ${serverStatus.host}`);
    console.log(`   - Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);

    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication error - check your username/password in the connection string');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Network error - check your connection string and network access settings in Atlas');
    }
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

testConnection();
