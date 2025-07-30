const axios = require('axios');

class MockJudge0Service {
  constructor() {
    this.baseURL = 'http://localhost:2358'; // Mock endpoint
    this.token = 'mock-token';
  }

  // Language mappings for Judge0
  getLanguageId(language) {
    const languageMap = {
      'c': 50,          // C (GCC 9.2.0)
      'cpp': 54,        // C++ (GCC 9.2.0)
      'java': 62,       // Java (OpenJDK 13.0.1)
      'python': 71,     // Python (3.8.1)
      'python3': 71,    // Python (3.8.1)
      'javascript': 63, // JavaScript (Node.js 12.14.0)
      'nodejs': 63,     // JavaScript (Node.js 12.14.0)
      'go': 60,         // Go (1.13.5)
      'rust': 73,       // Rust (1.40.0)
      'csharp': 51,     // C# (Mono 6.6.0.161)
      'php': 68,        // PHP (7.4.1)
      'ruby': 72,       // Ruby (2.7.0)
      'kotlin': 78,     // Kotlin (1.3.70)
      'swift': 83,      // Swift (5.2.3)
      'scala': 81,      // Scala (2.13.2)
      'perl': 85,       // Perl (5.28.1)
      'bash': 46,       // Bash (5.0.0)
      'sql': 82,        // SQL (SQLite 3.27.2)
    };
    
    return languageMap[language.toLowerCase()] || 71; // Default to Python
  }

  // Submit code for execution - Mock implementation
  async submitCode(sourceCode, languageId, input = '', expectedOutput = '') {
    try {
      console.log('Mock Judge0: Submitting code for execution');
      console.log('Language ID:', languageId);
      console.log('Input:', input);
      
      // Return a mock submission token
      return {
        token: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Mock Judge0 submission error:', error.message);
      throw new Error('Failed to submit code to Mock Judge0');
    }
  }

  // Get submission result - Mock implementation
  async getSubmissionResult(token) {
    try {
      console.log('Mock Judge0: Getting submission result for token:', token);
      
      // Mock execution result - more realistic
      const mockOutputs = [
        'Hello, World!',
        '42',
        'The answer is 42',
        'Success!',
        'Calculation complete'
      ];
      
      const result = {
        status: {
          id: 3,
          description: 'Accepted'
        },
        stdout: mockOutputs[Math.floor(Math.random() * mockOutputs.length)],
        stderr: '',
        compile_output: '',
        message: '',
        time: (Math.random() * 0.1 + 0.001).toFixed(3), // Random time between 0.001 and 0.1
        memory: Math.floor(Math.random() * 2048 + 1024), // Random memory between 1024 and 3072
        exit_code: 0
      };

      return result;
    } catch (error) {
      console.error('Mock Judge0 get result error:', error.message);
      throw new Error('Failed to get submission result from Mock Judge0');
    }
  }

  // Wait for submission to complete and return result
  async waitForResult(token, maxWaitTime = 30000) {
    console.log('Mock Judge0: Waiting for result...');
    
    // Mock a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.getSubmissionResult(token);
  }

  // Get status description
  getStatusDescription(statusId) {
    const statusMap = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error (SIGSEGV)',
      8: 'Runtime Error (SIGXFSZ)',
      9: 'Runtime Error (SIGFPE)',
      10: 'Runtime Error (SIGABRT)',
      11: 'Runtime Error (NZEC)',
      12: 'Runtime Error (Other)',
      13: 'Internal Error',
      14: 'Exec Format Error'
    };
    
    return statusMap[statusId] || 'Unknown';
  }

  // Execute code with multiple test cases
  async executeWithTestCases(sourceCode, languageId, testCases) {
    console.log('Mock Judge0: Executing with test cases');
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      try {
        const submission = await this.submitCode(
          sourceCode,
          languageId,
          testCase.input,
          testCase.expectedOutput
        );
        
        const result = await this.waitForResult(submission.token);
        
        // Simple mock logic: check if the code looks correct
        // For a more realistic simulation, we can analyze the code
        let isCorrect = false;
        let output = testCase.expectedOutput;
        
        // Simple heuristic: if the code contains basic structure, make it pass
        if (sourceCode.includes('print') || sourceCode.includes('cout') || sourceCode.includes('System.out')) {
          isCorrect = true;
        }
        
        // For demo purposes, make first test case always pass, others randomly pass
        if (i === 0) {
          isCorrect = true;
        } else {
          isCorrect = Math.random() > 0.2; // 80% chance of success
        }
        
        // If it fails, provide different output
        if (!isCorrect) {
          output = `Wrong output for test case ${i + 1}`;
        }
        
        results.push({
          testCaseIndex: i,
          status: isCorrect ? 'Accepted' : 'Wrong Answer',
          statusId: isCorrect ? 3 : 4,
          output: output,
          expectedOutput: testCase.expectedOutput,
          executionTime: result.time,
          memoryUsed: result.memory,
          error: result.stderr,
          isCorrect: isCorrect
        });
      } catch (error) {
        console.error(`Mock Judge0: Error executing test case ${i}:`, error.message);
        results.push({
          testCaseIndex: i,
          status: 'Runtime Error',
          statusId: 7,
          output: '',
          expectedOutput: testCase.expectedOutput,
          executionTime: null,
          memoryUsed: null,
          error: error.message,
          isCorrect: false
        });
      }
    }
    
    return results;
  }
}

module.exports = new MockJudge0Service();
