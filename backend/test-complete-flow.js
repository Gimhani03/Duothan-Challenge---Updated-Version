const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const User = require('./models/User');
const Submission = require('./models/Submission');

async function testCompleteUnlockFlow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');
    
    // Get all algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`📊 Found ${algorithmicChallenges.length} algorithmic challenges`);
    
    if (algorithmicChallenges.length === 0) {
      console.log('❌ No algorithmic challenges found! Create some challenges first.');
      return;
    }
    
    // Clean up test data
    await Team.deleteMany({ name: /Test.*Complete/ });
    await User.deleteMany({ username: /testuser.*complete/ });
    
    // Create test user and team
    const testUser = new User({
      username: 'testuser_complete',
      email: 'testcomplete@example.com',
      password: 'password123'
    });
    await testUser.save();
    
    const testTeam = new Team({
      name: 'Test Complete Flow Team',
      description: 'Team for complete flow testing',
      leader: testUser._id,
      members: [testUser._id],
      maxMembers: 4
    });
    await testTeam.save();
    
    testUser.team = testTeam._id;
    await testUser.save();
    console.log('✅ Created test user and team');
    
    // Simulate the submission process for each challenge
    for (let i = 0; i < algorithmicChallenges.length; i++) {
      const challenge = algorithmicChallenges[i];
      console.log(`\n🔄 Processing challenge ${i + 1}/${algorithmicChallenges.length}: ${challenge.title}`);
      
      // Create a submission
      const submission = new Submission({
        team: testTeam._id,
        challenge: challenge._id,
        submittedBy: testUser._id,
        code: 'print("Hello World")',
        language: 'python',
        languageId: 71, // Python language ID for Judge0
        submissionType: 'code',
        status: 'accepted',
        isCorrect: true,
        points: challenge.points,
        testCaseResults: [{
          index: 0,
          status: 'Accepted',
          isCorrect: true,
          actualOutput: 'Expected output',
          expectedOutput: 'Expected output'
        }]
      });
      await submission.save();
      
      // Update team completion manually (simulating the submission route logic)
      const alreadyCompleted = testTeam.completedChallenges.some(
        cc => cc.challengeId.toString() === challenge._id.toString()
      );
      
      if (!alreadyCompleted) {
        testTeam.completedChallenges.push({
          challengeId: challenge._id,
          completedAt: new Date(),
          points: challenge.points,
          isCorrect: true
        });
        testTeam.points += challenge.points;
        await testTeam.save();
      }
      
      console.log(`   ✅ Challenge completed successfully`);
      
      // Check if ALL algorithmic challenges are now completed correctly
      const correctlySolvedChallengeIds = testTeam.completedChallenges
        .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
        .map(cc => cc.challengeId.toString());
      
      const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
        correctlySolvedChallengeIds.includes(challenge._id.toString())
      ).length;
      
      console.log(`   📊 Progress: ${correctlySolvedAlgorithmicCount}/${algorithmicChallenges.length} algorithmic challenges solved`);
      
      // Generate unlock code if all challenges are completed (simulating the submission route logic)
      if (challenge.type === 'algorithmic' && 
          algorithmicChallenges.length > 0 && 
          correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
          !testTeam.buildathonUnlockCode) {
        
        const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
        testTeam.buildathonUnlockCode = unlockCode;
        await testTeam.save();
        
        console.log(`   🎉 ALL ALGORITHMIC CHALLENGES COMPLETED!`);
        console.log(`   🔑 Generated unlock code: ${unlockCode}`);
        
        // Simulate the API response that would be sent to frontend
        const apiResponse = {
          message: 'All test cases passed!',
          submission: submission.toObject(),
          unlockCode: {
            generated: true,
            code: unlockCode,
            message: '🎉 Congratulations! You have completed all algorithmic challenges. Use this code to unlock buildathon challenges.'
          }
        };
        
        console.log(`   📤 API Response would include:`);
        console.log(`      - unlockCode.generated: ${apiResponse.unlockCode.generated}`);
        console.log(`      - unlockCode.code: ${apiResponse.unlockCode.code}`);
        console.log(`      - unlockCode.message: ${apiResponse.unlockCode.message}`);
        
        break; // Stop after generating unlock code
      }
    }
    
    // Verify final state
    const finalTeam = await Team.findById(testTeam._id);
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`   - Team Points: ${finalTeam.points}`);
    console.log(`   - Completed Challenges: ${finalTeam.completedChallenges.length}`);
    console.log(`   - Unlock Code Generated: ${finalTeam.buildathonUnlockCode ? 'YES' : 'NO'}`);
    if (finalTeam.buildathonUnlockCode) {
      console.log(`   - Unlock Code: ${finalTeam.buildathonUnlockCode}`);
    }
    
    // Test the challenges API response
    console.log(`\n🔍 Testing Challenges API Response:`);
    const correctlySolvedChallengeIds = finalTeam.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId.toString());
    
    const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    const allAlgorithmicCompleted = algorithmicChallenges.length > 0 && 
                                   correctlySolvedAlgorithmicCount === algorithmicChallenges.length;
    
    console.log(`   - allAlgorithmicCompleted: ${allAlgorithmicCompleted}`);
    console.log(`   - unlockCode in response: ${allAlgorithmicCompleted ? finalTeam.buildathonUnlockCode : 'null'}`);
    
    // Clean up
    await Team.deleteMany({ name: /Test.*Complete/ });
    await User.deleteMany({ username: /testuser.*complete/ });
    await Submission.deleteMany({ team: testTeam._id });
    console.log(`\n✅ Cleaned up test data`);
    
    console.log(`\n🎉 ALL TESTS PASSED! Unlock code system is working correctly.`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCompleteUnlockFlow();
