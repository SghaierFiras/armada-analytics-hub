require('dotenv').config();
const { MongoClient } = require('mongodb');

async function listCollections() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB Atlas...\n');
    await client.connect();

    // Access the production database (heroku_v801wdr2)
    const database = client.db('heroku_v801wdr2');

    console.log('📦 Database: heroku_v801wdr2\n');

    // List all collections
    const collections = await database.listCollections().toArray();

    console.log(`Found ${collections.length} collection(s):\n`);

    for (const collection of collections) {
      console.log(`📁 ${collection.name}`);

      // Get collection info
      try {
        const coll = database.collection(collection.name);

        // Count documents
        const count = await coll.countDocuments();
        console.log(`   - Documents: ${count.toLocaleString()}`);

        // Get indexes
        const indexes = await coll.indexes();
        console.log(`   - Indexes: ${indexes.length}`);

        // Show a sample document structure (just field names)
        if (count > 0) {
          const sampleDoc = await coll.findOne();
          if (sampleDoc) {
            const fields = Object.keys(sampleDoc).slice(0, 10);
            if (Object.keys(sampleDoc).length > 10) {
              console.log(`   - Fields (first 10): ${fields.join(', ')}...`);
            } else {
              console.log(`   - Fields: ${fields.join(', ')}`);
            }
          }
        }
        console.log('');
      } catch (error) {
        console.log(`   - Unable to get info: ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

listCollections();
