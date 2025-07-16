const mongoose = require('mongoose');
const User = require('./models/User');
const Challenge = require('./models/Challenge');
require('dotenv').config();

const sampleChallenges = [
  {
    title: "Two Sum",
    description: "Find two numbers in an array that add up to a target sum.",
    problemStatement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    inputFormat: "First line contains n (array size) and target.\nSecond line contains n space-separated integers.",
    outputFormat: "Two space-separated integers representing the indices (0-indexed).",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    sampleInput: "4 9\n2 7 11 15",
    sampleOutput: "0 1",
    explanation: "Because nums[0] + nums[1] = 2 + 7 = 9, we return [0, 1].",
    type: "algorithmic",
    difficulty: "easy",
    points: 100,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      {
        input: "4 9\n2 7 11 15",
        expectedOutput: "0 1",
        isHidden: false
      },
      {
        input: "3 6\n3 2 4",
        expectedOutput: "1 2",
        isHidden: false
      },
      {
        input: "2 6\n3 3",
        expectedOutput: "0 1",
        isHidden: true
      }
    ],
    flag: "duothan{two_sum_solved}",
    order: 1
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string.",
    problemStatement: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    inputFormat: "A single line containing a string.",
    outputFormat: "The reversed string.",
    constraints: "1 <= s.length <= 10^5\ns[i] is a printable ascii character.",
    sampleInput: "hello",
    sampleOutput: "olleh",
    explanation: "The string 'hello' reversed is 'olleh'.",
    type: "algorithmic",
    difficulty: "easy",
    points: 75,
    timeLimit: 1,
    memoryLimit: 128,
    testCases: [
      {
        input: "hello",
        expectedOutput: "olleh",
        isHidden: false
      },
      {
        input: "Hannah",
        expectedOutput: "hannaH",
        isHidden: false
      },
      {
        input: "racecar",
        expectedOutput: "racecar",
        isHidden: true
      }
    ],
    flag: "duothan{string_reversed}",
    order: 2
  },
  {
    title: "Binary Search",
    description: "Implement binary search algorithm.",
    problemStatement: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    inputFormat: "First line contains n (array size) and target.\nSecond line contains n space-separated sorted integers.",
    outputFormat: "Index of target element, or -1 if not found.",
    constraints: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll the integers in nums are unique.\nnums is sorted in ascending order.",
    sampleInput: "6 0\n-1 0 3 5 9 12",
    sampleOutput: "1",
    explanation: "0 exists in nums and its index is 1",
    type: "algorithmic",
    difficulty: "medium",
    points: 150,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      {
        input: "6 0\n-1 0 3 5 9 12",
        expectedOutput: "1",
        isHidden: false
      },
      {
        input: "6 2\n-1 0 3 5 9 12",
        expectedOutput: "-1",
        isHidden: false
      },
      {
        input: "1 5\n5",
        expectedOutput: "0",
        isHidden: true
      }
    ],
    flag: "duothan{binary_search_master}",
    order: 3,
    unlockConditions: [] // Can reference other challenge IDs after they're created
  },
  {
    title: "Web Application Challenge",
    description: "Build a simple task management web application.",
    problemStatement: `Create a web application with the following features:

1. User can add new tasks
2. User can mark tasks as completed
3. User can delete tasks
4. Tasks should persist (use localStorage or a simple backend)
5. Responsive design

The application should be deployable and accessible via a GitHub repository.`,
    inputFormat: "N/A - This is a buildathon challenge",
    outputFormat: "GitHub repository URL with working application",
    constraints: "Use any modern web framework (React, Vue, Angular, etc.)\nCode should be well-documented\nApplication should be functional",
    sampleInput: "N/A",
    sampleOutput: "N/A",
    explanation: "Submit your GitHub repository URL containing the web application source code.",
    type: "buildathon",
    difficulty: "medium",
    points: 200,
    githubSubmissionRequired: true,
    submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    order: 4
  },
  {
    title: "Longest Common Subsequence",
    description: "Find the length of the longest common subsequence between two strings.",
    problemStatement: `Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.

A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

A common subsequence of two strings is a subsequence that is common to both strings.`,
    inputFormat: "Two lines, each containing a string.",
    outputFormat: "Length of the longest common subsequence.",
    constraints: "1 <= text1.length, text2.length <= 1000\ntext1 and text2 consist of only lowercase English characters.",
    sampleInput: "abcde\nace",
    sampleOutput: "3",
    explanation: "The longest common subsequence is 'ace' and its length is 3.",
    type: "algorithmic",
    difficulty: "hard",
    points: 250,
    timeLimit: 3,
    memoryLimit: 512,
    testCases: [
      {
        input: "abcde\nace",
        expectedOutput: "3",
        isHidden: false
      },
      {
        input: "abc\nabc",
        expectedOutput: "3",
        isHidden: false
      },
      {
        input: "abc\ndef",
        expectedOutput: "0",
        isHidden: true
      }
    ],
    flag: "duothan{lcs_dynamic_programming}",
    order: 5,
    unlockConditions: [] // Will be set after binary search challenge is created
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan');
    console.log('Connected to MongoDB');

    // Clear existing challenges
    await Challenge.deleteMany({});
    console.log('Cleared existing challenges');

    // Create sample challenges
    const createdChallenges = await Challenge.insertMany(sampleChallenges);
    console.log(`Created ${createdChallenges.length} sample challenges`);

    // Set unlock conditions (Binary Search challenge unlocks after Two Sum and Reverse String)
    const twoSumChallenge = createdChallenges.find(c => c.title === "Two Sum");
    const reverseStringChallenge = createdChallenges.find(c => c.title === "Reverse String");
    const binarySearchChallenge = createdChallenges.find(c => c.title === "Binary Search");
    const lcsChallenge = createdChallenges.find(c => c.title === "Longest Common Subsequence");

    if (binarySearchChallenge && twoSumChallenge && reverseStringChallenge) {
      binarySearchChallenge.unlockConditions = [twoSumChallenge._id, reverseStringChallenge._id];
      await binarySearchChallenge.save();
      console.log('Set unlock conditions for Binary Search challenge');
    }

    if (lcsChallenge && binarySearchChallenge) {
      lcsChallenge.unlockConditions = [binarySearchChallenge._id];
      await lcsChallenge.save();
      console.log('Set unlock conditions for LCS challenge');
    }

    // Create specific admin user
    const adminEmail = 'bytebloom@gmail.com';
    const adminPassword = 'ByteBloom4';

    // Remove any existing admin users first
    await User.deleteMany({ role: 'admin' });

    const adminUser = new User({
      username: 'ByteBloom Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    await adminUser.save();
    console.log(`Created admin user with email: ${adminEmail}`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
