const axios = require('axios');

class Judge0Service {
  constructor() {
    this.baseURL = process.env.JUDGE0_API_URL;
    this.token = process.env.JUDGE0_API_TOKEN;
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

  // Submit code for execution
  async submitCode(sourceCode, languageId, input = '', expectedOutput = '') {
    try {
      const submissionData = {
        source_code: Buffer.from(sourceCode).toString('base64'),
        language_id: languageId,
        stdin: input ? Buffer.from(input).toString('base64') : undefined,
        expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : undefined
      };

      const response = await axios.post(
        `${this.baseURL}/submissions?base64_encoded=true&wait=false`,
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.token,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Judge0 submission error:', error.response?.data || error.message);
      throw new Error('Failed to submit code to Judge0');
    }
  }

  // Get submission result
  async getSubmissionResult(token) {
    try {
      const response = await axios.get(
        `${this.baseURL}/submissions/${token}?base64_encoded=true`,
        {
          headers: {
            'X-RapidAPI-Key': this.token,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        }
      );

      const result = response.data;
      
      // Decode base64 encoded fields
      if (result.stdout) {
        result.stdout = Buffer.from(result.stdout, 'base64').toString();
      }
      if (result.stderr) {
        result.stderr = Buffer.from(result.stderr, 'base64').toString();
      }
      if (result.compile_output) {
        result.compile_output = Buffer.from(result.compile_output, 'base64').toString();
      }

      return result;
    } catch (error) {
      console.error('Judge0 get result error:', error.response?.data || error.message);
      throw new Error('Failed to get submission result from Judge0');
    }
  }

  // Wait for submission to complete and return result
  async waitForResult(token, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getSubmissionResult(token);
      
      // Check if processing is complete
      if (result.status.id > 2) { // Status IDs 1 and 2 are "In Queue" and "Processing"
        return result;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Submission timeout');
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
        
        // Normalize outputs for comparison (handle different whitespace patterns)
        const actualOutput = (result.stdout || '').trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // For debugging
        console.log(`Test case ${i}:`);
        console.log(`  Expected: "${expectedOutput}"`);
        console.log(`  Actual:   "${actualOutput}"`);
        console.log(`  Match:    ${actualOutput === expectedOutput}`);
        
        results.push({
          testCaseIndex: i,
          status: this.getStatusDescription(result.status.id),
          statusId: result.status.id,
          output: result.stdout || '',
          expectedOutput: testCase.expectedOutput,
          executionTime: result.time,
          memoryUsed: result.memory,
          error: result.stderr || result.compile_output || '',
          isCorrect: result.status.id === 3 && actualOutput === expectedOutput
        });
      } catch (error) {
        results.push({
          testCaseIndex: i,
          status: 'Error',
          statusId: -1,
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

module.exports = new Judge0Service();
