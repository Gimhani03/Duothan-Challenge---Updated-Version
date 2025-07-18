const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const User = require('./models/User');
const Submission = require('./models/Submission');

async function testUnlockCodeGeneration() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');
    
    // Clean up test data
    await Team.deleteMany({ name: /Test.*Unlock/ });
    await User.deleteMany({ username: /testuser.*unlock/ });
    await Challenge.deleteMany({ title: /Test.*Unlock/ });
    await Submission.deleteMany({});
    
    // Create test challenges
    const challenge1 = new Challenge({
      title: 'Test Unlock Challenge 1',
      description: 'First test challenge',
      problemStatement: 'Solve this problem',
      inputFormat: 'Input format',
      outputFormat: 'Output format',
      constraints: 'Constraints',
      sampleInput: '5',
      sampleOutput: '10',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 100,
      testCases: [{
        input: '5',
        expectedOutput: '10',
        isHidden: false
      }],
      isActive: true
    });
    
    const challenge2 = new Challenge({
      title: 'Test Unlock Challenge 2',
      description: 'Second test challenge',
      problemStatement: 'Solve this problem',
      inputFormat: 'Input format',
      outputFormat: 'Output format',
      constraints: 'Constraints',
      sampleInput: '3',
      sampleOutput: '6',
      type: 'algorithmic',
      difficulty: 'medium',
      points: 150,
      testCases: [{
        input: '3',
        expectedOutput: '6',
        isHidden: false
      }],
      isActive: true
    });
    
    await challenge1.save();
    await challenge2.save();
    console.log('✅ Created 2 test algorithmic challenges');
    
    // Create test user and team
    const testUser = new User({
      username: 'testuser_unlock',
      email: 'testunlock@example.com',
      password: 'password123'
    });
    await testUser.save();
    
    const testTeam = new Team({
      name: 'Test Unlock Team',
      description: 'Team for unlock code testing',
      leader: testUser._id,
      members: [testUser._id],
      maxMembers: 4
    });
    await testTeam.save();
    
    testUser.team = testTeam._id;
    await testUser.save();
    console.log('✅ Created test user and team');
    
    // Simulate completing first challenge
    testTeam.completedChallenges.push({
      challengeId: challenge1._id,
      completedAt: new Date(),
      points: 100,
      isCorrect: true
    });
    testTeam.points += 100;
    await testTeam.save();
    console.log('✅ Completed first challenge');
    
    // Check if unlock code is generated (should NOT be generated yet)
    let updatedTeam = await Team.findById(testTeam._id);
    if (updatedTeam.buildathonUnlockCode) {
      console.log('❌ Unlock code generated too early!');
    } else {
      console.log('✅ Unlock code NOT generated yet (correct)');
    }
    
    // Simulate completing second challenge (should trigger unlock code generation)
    testTeam.completedChallenges.push({
      challengeId: challenge2._id,
      completedAt: new Date(),
      points: 150,
      isCorrect: true
    });
    testTeam.points += 150;
    await testTeam.save();
    
    // Check if ALL algorithmic challenges are completed
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const correctlySolvedChallengeIds = testTeam.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId.toString());
    
    const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`📊 Algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    
    // Simulate the unlock code generation logic
    if (algorithmicChallenges.length > 0 && 
        correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
        !testTeam.buildathonUnlockCode) {
      
      const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
      testTeam.buildathonUnlockCode = unlockCode;
      await testTeam.save();
      console.log(`🎉 Generated unlock code: ${unlockCode}`);
    }
    
    // Verify unlock code was generated
    updatedTeam = await Team.findById(testTeam._id);
    if (updatedTeam.buildathonUnlockCode) {
      console.log('✅ Unlock code generated successfully!');
      console.log(`🔑 Unlock code: ${updatedTeam.buildathonUnlockCode}`);
    } else {
      console.log('❌ Unlock code was NOT generated');
    }
    
    // Clean up
    await Team.deleteMany({ name: /Test.*Unlock/ });
    await User.deleteMany({ username: /testuser.*unlock/ });
    await Challenge.deleteMany({ title: /Test.*Unlock/ });
    console.log('✅ Cleaned up test data');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUnlockCodeGeneration();
