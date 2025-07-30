require('dotenv').config();
const mockJudge0Service = require('./services/mockJudge0Service');

async function testMockExecution() {
  try {
    console.log('Testing mock Judge0 service...');
    
    const submission = await mockJudge0Service.submitCode(
      'print("Hello, World!")',
      71, // Python
      ''
    );
    console.log('Submission token:', submission.token);
    
    const result = await mockJudge0Service.waitForResult(submission.token);
    console.log('Execution result:', result);
    
    console.log('Mock Judge0 service is working correctly!');
  } catch (error) {
    console.error('Error testing mock service:', error.message);
  }
}

testMockExecution();
