require('dotenv').config();
const { MongoClient } = require('mongodb');

async function quickListCollections() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    const database = client.db('heroku_v801wdr2');
    console.log('📦 Database: heroku_v801wdr2\n');

    // List all collections (fast)
    const collections = await database.listCollections().toArray();

    console.log(`Found ${collections.length} collection(s):\n`);

    // Sort alphabetically
    collections.sort((a, b) => a.name.localeCompare(b.name));

    collections.forEach((collection, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

quickListCollections();
