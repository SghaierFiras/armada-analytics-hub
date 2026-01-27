/**
 * Simple API Test Script
 * Tests the new analytics API endpoints
 */

const http = require('http');

// Give server time to start
setTimeout(async () => {
  console.log('Testing API endpoints...\n');

  // Test health endpoint
  await testEndpoint('/api/health', 'Health Check');

  // Test API info endpoint
  await testEndpoint('/api', 'API Info');

  // Test merchants analytics (will take longer, has real data)
  await testEndpoint('/api/merchants/analytics?year=2025', 'Merchants Analytics');

  console.log('\n✅ All API tests completed!');
  process.exit(0);
}, 2000);

function testEndpoint(path, name) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 ${name} (${path})`);
        console.log(`   Status: ${res.statusCode}`);

        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 100)}...`);
        }

        console.log('');
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${name} failed:`, err.message);
      resolve();
    });
  });
}
