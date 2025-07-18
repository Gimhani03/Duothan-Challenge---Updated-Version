require('dotenv').config();
const axios = require('axios');

async function testRunEndpoint() {
  try {
    console.log('Testing /run endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/submissions/run', {
      code: 'print("Hello from test!")',
      language: 'python',
      input: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testRunEndpoint();
