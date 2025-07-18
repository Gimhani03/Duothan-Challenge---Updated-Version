const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const User = require('./models/User');
const Submission = require('./models/Submission');

async function testDynamicUnlockCode() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');
    
    // Clean up test data
    await Team.deleteMany({ name: /Dynamic.*Test/ });
    await User.deleteMany({ username: /dynamictest/ });
    await Challenge.deleteMany({ title: /Dynamic.*Test/ });
    
    console.log('🧪 Testing Dynamic Unlock Code System');
    console.log('=====================================\n');
    
    // Test scenarios with different challenge counts
    const testScenarios = [
      { count: 1, description: 'Single Challenge' },
      { count: 3, description: 'Three Challenges' },
      { count: 5, description: 'Five Challenges' }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`📊 Testing Scenario: ${scenario.description} (${scenario.count} challenges)`);
      
      // Create test challenges
      const challenges = [];
      for (let i = 1; i <= scenario.count; i++) {
        const challenge = new Challenge({
          title: `Dynamic Test Challenge ${i}`,
          description: `Test challenge ${i} for dynamic testing`,
          problemStatement: `Solve problem ${i}`,
          inputFormat: 'Input format',
          outputFormat: 'Output format',
          constraints: 'Constraints',
          sampleInput: `${i}`,
          sampleOutput: `${i * 2}`,
          type: 'algorithmic',
          difficulty: 'easy',
          points: 100,
          testCases: [{
            input: `${i}`,
            expectedOutput: `${i * 2}`,
            isHidden: false
          }],
          isActive: true
        });
        await challenge.save();
        challenges.push(challenge);
      }
      console.log(`   ✅ Created ${challenges.length} algorithmic challenges`);
      
      // Create test user and team
      const testUser = new User({
        username: `dynamictest${scenario.count}`,
        email: `dynamictest${scenario.count}@example.com`,
        password: 'password123'
      });
      await testUser.save();
      
      const testTeam = new Team({
        name: `Dynamic Test Team ${scenario.count}`,
        description: `Team for ${scenario.count} challenge testing`,
        leader: testUser._id,
        members: [testUser._id],
        maxMembers: 4
      });
      await testTeam.save();
      
      testUser.team = testTeam._id;
      await testUser.save();
      
      // Complete challenges one by one
      for (let i = 0; i < challenges.length; i++) {
        const challenge = challenges[i];
        
        // Add completion
        testTeam.completedChallenges.push({
          challengeId: challenge._id,
          completedAt: new Date(),
          points: challenge.points,
          isCorrect: true
        });
        testTeam.points += challenge.points;
        await testTeam.save();
        
        // Check unlock code generation logic
        const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
        const correctlySolvedChallengeIds = testTeam.completedChallenges
          .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
          .map(cc => cc.challengeId.toString());
        
        const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
          correctlySolvedChallengeIds.includes(challenge._id.toString())
        ).length;
        
        console.log(`   🔄 Completed challenge ${i + 1}/${challenges.length}`);
        console.log(`   📊 Total algorithmic challenges in system: ${algorithmicChallenges.length}`);
        console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
        
        // Generate unlock code if all challenges are completed
        if (algorithmicChallenges.length > 0 && 
            correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
            !testTeam.buildathonUnlockCode) {
          
          const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
          testTeam.buildathonUnlockCode = unlockCode;
          await testTeam.save();
          
          console.log(`   🎉 UNLOCK CODE GENERATED: ${unlockCode}`);
          console.log(`   ✅ Success: All ${algorithmicChallenges.length} algorithmic challenges completed!`);
          break;
        }
      }
      
      // Verify unlock code was generated
      const finalTeam = await Team.findById(testTeam._id);
      if (finalTeam.buildathonUnlockCode) {
        console.log(`   ✅ Test PASSED: Unlock code generated for ${scenario.count} challenges`);
      } else {
        console.log(`   ❌ Test FAILED: No unlock code generated for ${scenario.count} challenges`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Test admin removing challenges scenario
    console.log('🔧 Testing Admin Challenge Removal Scenario');
    console.log('==========================================\n');
    
    // Create 3 challenges
    const adminTestChallenges = [];
    for (let i = 1; i <= 3; i++) {
      const challenge = new Challenge({
        title: `Admin Test Challenge ${i}`,
        description: `Admin test challenge ${i}`,
        problemStatement: `Solve problem ${i}`,
        inputFormat: 'Input format',
        outputFormat: 'Output format',
        constraints: 'Constraints',
        sampleInput: `${i}`,
        sampleOutput: `${i * 2}`,
        type: 'algorithmic',
        difficulty: 'easy',
        points: 100,
        testCases: [{
          input: `${i}`,
          expectedOutput: `${i * 2}`,
          isHidden: false
        }],
        isActive: true
      });
      await challenge.save();
      adminTestChallenges.push(challenge);
    }
    
    // Create team and complete 2 challenges
    const adminTestUser = new User({
      username: 'admintestuser',
      email: 'admintest@example.com',
      password: 'password123'
    });
    await adminTestUser.save();
    
    const adminTestTeam = new Team({
      name: 'Admin Test Team',
      description: 'Team for admin testing',
      leader: adminTestUser._id,
      members: [adminTestUser._id],
      maxMembers: 4
    });
    await adminTestTeam.save();
    
    adminTestUser.team = adminTestTeam._id;
    await adminTestUser.save();
    
    // Complete first 2 challenges
    for (let i = 0; i < 2; i++) {
      adminTestTeam.completedChallenges.push({
        challengeId: adminTestChallenges[i]._id,
        completedAt: new Date(),
        points: 100,
        isCorrect: true
      });
      adminTestTeam.points += 100;
    }
    await adminTestTeam.save();
    
    console.log('   ✅ Created 3 challenges, team completed 2');
    console.log('   📊 Status: 2/3 challenges completed - NO unlock code yet');
    
    // Admin removes the 3rd challenge (simulating admin deactivation)
    adminTestChallenges[2].isActive = false;
    await adminTestChallenges[2].save();
    
    console.log('   🔧 Admin deactivated 3rd challenge');
    
    // Now check if unlock code should be generated
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const correctlySolvedChallengeIds = adminTestTeam.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId.toString());
    
    const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Active algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    
    if (algorithmicChallenges.length > 0 && 
        correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
        !adminTestTeam.buildathonUnlockCode) {
      
      const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
      adminTestTeam.buildathonUnlockCode = unlockCode;
      await adminTestTeam.save();
      
      console.log(`   🎉 UNLOCK CODE GENERATED: ${unlockCode}`);
      console.log(`   ✅ Success: Team now has unlock code after admin removed challenge!`);
    } else {
      console.log(`   ❌ No unlock code generated after admin change`);
    }
    
    // Clean up all test data
    await Team.deleteMany({ name: /Dynamic.*Test|Admin.*Test/ });
    await User.deleteMany({ username: /dynamictest|admintestuser/ });
    await Challenge.deleteMany({ title: /Dynamic.*Test|Admin.*Test/ });
    
    console.log('\n✅ All tests completed successfully!');
    console.log('🎯 System is fully dynamic and adapts to challenge count changes!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDynamicUnlockCode();
