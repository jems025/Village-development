const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- STARTING BACKEND API VERIFICATION TESTS ---');
  let token = '';
  let testVillageId = '';

  try {
    // Test 1: Health check
    console.log('Test 1: Verifying base server path...');
    const health = await axios.get('http://localhost:5000/');
    console.log(`  Result: Server is alive. Response: "${health.data}"`);

    // Test 2: Login as Admin
    console.log('Test 2: Authenticating as Admin...');
    try {
      const authRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@village.gov.in',
        password: 'admin123'
      });
      if (authRes.data.success) {
        token = authRes.data.token;
        console.log('  Result: Auth successful. Admin JWT received.');
      }
    } catch (authErr) {
      console.log('  Result: Auth failed. Make sure database is seeded and server is running.');
      throw authErr;
    }

    // Set authorization header for subsequent requests
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Test 3: List Villages
    console.log('Test 3: Fetching villages list...');
    const villageRes = await axios.get(`${API_URL}/villages`, config);
    if (villageRes.data.success) {
      console.log(`  Result: Retrieved ${villageRes.data.count} villages successfully.`);
      if (villageRes.data.count > 0) {
        testVillageId = villageRes.data.data[0]._id;
      }
    }

    // Test 4: List Projects
    console.log('Test 4: Fetching projects list...');
    const projectRes = await axios.get(`${API_URL}/projects`, config);
    if (projectRes.data.success) {
      console.log(`  Result: Retrieved ${projectRes.data.count} development projects successfully.`);
    }

    // Test 5: Fetch Analytics
    console.log('Test 5: Fetching central district analytics...');
    const analyticRes = await axios.get(`${API_URL}/analytics/district`, config);
    if (analyticRes.data.success) {
      console.log('  Result: Retrieved district analytics. Dashboard counters loaded.');
    }

    console.log('\n--- ALL API SUITE VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('\n--- TEST EXECUTION ENCOUNTERED AN ERROR ---');
    console.error(`Error details: ${error.message}`);
    if (error.response) {
      console.error(`Server error body: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  }
};

runTests();
