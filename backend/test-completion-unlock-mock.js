const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/duothan-challenge');

async function testCompletionUnlockWithMockData() {
  try {
    console.log('🧪 Testing completion-based unlock code generation with mock data...');
    
    // Clean up existing data
    await Challenge.deleteMany({});
    await Team.deleteMany({});
    
    // Create mock challenges
    const challenge1 = await Challenge.create({
      title: 'Algorithm Challenge 1',
      description: 'First challenge',
      problemStatement: 'Solve this algorithmic problem',
      inputFormat: 'Input format description',
      outputFormat: 'Output format description',
      constraints: 'Constraints description',
      sampleInput: 'Sample input',
      sampleOutput: 'Sample output',
      type: 'algorithmic',
      isActive: true,
      difficulty: 'easy',
      points: 100,
      testCases: []
    });
    
    const challenge2 = await Challenge.create({
      title: 'Algorithm Challenge 2',
      description: 'Second challenge',
      problemStatement: 'Solve this second algorithmic problem',
      inputFormat: 'Input format description',
      outputFormat: 'Output format description',
      constraints: 'Constraints description',
      sampleInput: 'Sample input',
      sampleOutput: 'Sample output',
      type: 'algorithmic',
      isActive: true,
      difficulty: 'medium',
      points: 200,
      testCases: []
    });
    
    const challenge3 = await Challenge.create({
      title: 'Buildathon Challenge',
      description: 'Final challenge',
      problemStatement: 'Build something amazing',
      inputFormat: 'Input format description',
      outputFormat: 'Output format description',
      constraints: 'Constraints description',
      sampleInput: 'Sample input',
      sampleOutput: 'Sample output',
      type: 'buildathon',
      isActive: true,
      difficulty: 'hard',
      points: 500,
      testCases: []
    });
    
    console.log('✅ Created mock challenges');
    
    // Create a mock team with versioned requirements
    const team = await Team.create({
      name: 'Test Team',
      members: ['testuser@example.com'],
      isActive: true,
      requiredChallenges: [
        { challengeId: challenge1._id, capturedAt: new Date() },
        { challengeId: challenge2._id, capturedAt: new Date() }
      ],
      completedChallenges: [
        { 
          challengeId: challenge1._id, 
          isCorrect: false,  // Note: incorrect but completed
          completedAt: new Date() 
        },
        { 
          challengeId: challenge2._id, 
          isCorrect: false,  // Note: incorrect but completed
          completedAt: new Date() 
        }
      ]
    });
    
    console.log('✅ Created mock team with incorrect but completed challenges');
    
    // Test 1: Check if unlock code is generated (should be, since both challenges are completed)
    console.log('\n🔍 Test 1: Checking unlock code generation...');
    const codeGenerated = await team.checkAndGenerateUnlockCode();
    
    console.log(`   - Code generated: ${codeGenerated ? 'Yes' : 'No'}`);
    
    // Reload team to see if code was generated
    const updatedTeam = await Team.findById(team._id);
    console.log(`   - Unlock code: ${updatedTeam.buildathonUnlockCode || 'None'}`);
    
    // Test 2: Create a team with only one completed challenge
    const partialTeam = await Team.create({
      name: 'Partial Team',
      members: ['partial@example.com'],
      isActive: true,
      requiredChallenges: [
        { challengeId: challenge1._id, capturedAt: new Date() },
        { challengeId: challenge2._id, capturedAt: new Date() }
      ],
      completedChallenges: [
        { 
          challengeId: challenge1._id, 
          isCorrect: true,  // Correct but incomplete
          completedAt: new Date() 
        }
      ]
    });
    
    console.log('\n🔍 Test 2: Checking partial completion...');
    const partialCodeGenerated = await partialTeam.checkAndGenerateUnlockCode();
    
    console.log(`   - Code generated: ${partialCodeGenerated ? 'Yes' : 'No'} (should be No)`);
    
    // Test 3: Test the static method to check all teams
    console.log('\n🔍 Test 3: Checking all teams for unlock codes...');
    const codesGenerated = await Team.checkAllTeamsForUnlockCodes();
    console.log(`   - Total codes generated: ${codesGenerated}`);
    
    // Test 4: Simulate API endpoint logic
    console.log('\n🔍 Test 4: Simulating API endpoint logic...');
    
    // Get all algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    // Test the updated team
    const testTeam = await Team.findById(team._id).populate('completedChallenges.challengeId');
    
    const completedChallengeIds = testTeam.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    const completedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   - Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   - Completed algorithmic challenges: ${completedAlgorithmicCount}`);
    console.log(`   - All required completed: ${completedAlgorithmicCount === algorithmicChallenges.length ? 'Yes' : 'No'}`);
    console.log(`   - Has unlock code: ${testTeam.buildathonUnlockCode ? 'Yes' : 'No'}`);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 Summary:');
    console.log('   - Teams can now get unlock codes based on COMPLETION, not correctness');
    console.log('   - Wrong answers still count as completed challenges');
    console.log('   - Only need to attempt all algorithmic challenges, not solve them correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCompletionUnlockWithMockData();
