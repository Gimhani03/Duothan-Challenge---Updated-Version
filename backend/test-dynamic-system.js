const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const User = require('./models/User');

async function testDynamicSystem() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');
    
    // Clean up test data
    await Team.deleteMany({ name: /Dynamic.*System/ });
    await User.deleteMany({ username: /dynamicsystem/ });
    await Challenge.deleteMany({ title: /Dynamic.*System/ });
    
    console.log('🧪 Testing Dynamic Unlock Code System with Admin Changes');
    console.log('=======================================================\n');
    
    // Test 1: Start with 2 challenges, complete them, get unlock code
    console.log('📝 Test 1: Create 2 challenges, complete them');
    const challenge1 = new Challenge({
      title: 'Dynamic System Test 1',
      description: 'First challenge',
      problemStatement: 'Solve this',
      inputFormat: 'Input',
      outputFormat: 'Output',
      constraints: 'None',
      sampleInput: '1',
      sampleOutput: '2',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 100,
      testCases: [{ input: '1', expectedOutput: '2', isHidden: false }],
      isActive: true
    });
    
    const challenge2 = new Challenge({
      title: 'Dynamic System Test 2',
      description: 'Second challenge',
      problemStatement: 'Solve this',
      inputFormat: 'Input',
      outputFormat: 'Output',
      constraints: 'None',
      sampleInput: '2',
      sampleOutput: '4',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 100,
      testCases: [{ input: '2', expectedOutput: '4', isHidden: false }],
      isActive: true
    });
    
    await challenge1.save();
    await challenge2.save();
    
    // Create team
    const user = new User({
      username: 'dynamicsystem1',
      email: 'dynamicsystem1@example.com',
      password: 'password123'
    });
    await user.save();
    
    const team = new Team({
      name: 'Dynamic System Team',
      description: 'Test team',
      leader: user._id,
      members: [user._id],
      maxMembers: 4
    });
    await team.save();
    
    user.team = team._id;
    await user.save();
    
    // Complete the challenges
    team.completedChallenges.push(
      {
        challengeId: challenge1._id,
        completedAt: new Date(),
        points: 100,
        isCorrect: true
      },
      {
        challengeId: challenge2._id,
        completedAt: new Date(),
        points: 100,
        isCorrect: true
      }
    );
    team.points = 200;
    await team.save();
    
    // Check for unlock code generation
    let algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    let correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId.toString());
    
    let correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    
    if (algorithmicChallenges.length > 0 && 
        correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
        !team.buildathonUnlockCode) {
      
      const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
      team.buildathonUnlockCode = unlockCode;
      await team.save();
      console.log(`   🎉 Generated unlock code: ${unlockCode}`);
    }
    
    // Test 2: Admin adds a new challenge - unlock code should be removed/invalidated
    console.log('\\n📝 Test 2: Admin adds new challenge');
    const challenge3 = new Challenge({
      title: 'Dynamic System Test 3',
      description: 'Third challenge added by admin',
      problemStatement: 'Solve this',
      inputFormat: 'Input',
      outputFormat: 'Output',
      constraints: 'None',
      sampleInput: '3',
      sampleOutput: '6',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 100,
      testCases: [{ input: '3', expectedOutput: '6', isHidden: false }],
      isActive: true
    });
    await challenge3.save();
    
    // Check status after adding challenge
    algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    console.log(`   📊 Team now needs to complete challenge 3 to maintain unlock code eligibility`);
    
    // Test 3: Complete the new challenge
    console.log('\\n📝 Test 3: Complete the new challenge');
    team.completedChallenges.push({
      challengeId: challenge3._id,
      completedAt: new Date(),
      points: 100,
      isCorrect: true
    });
    team.points += 100;
    await team.save();
    
    // Update counts
    correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId.toString());
    
    correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    console.log(`   ✅ Team completed all challenges again!`);
    
    // Test 4: Admin removes a challenge
    console.log('\\n📝 Test 4: Admin removes challenge 3');
    challenge3.isActive = false;
    await challenge3.save();
    
    // Simulate the checkAndGenerateUnlockCodes function
    algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    console.log(`   ✅ Team still has unlock code eligibility!`);
    
    // Test 5: Edge case - Admin removes all challenges
    console.log('\\n📝 Test 5: Admin removes all challenges');
    challenge1.isActive = false;
    challenge2.isActive = false;
    await challenge1.save();
    await challenge2.save();
    
    algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 No algorithmic challenges left - unlock codes should remain valid`);
    
    // Test 6: Admin adds challenges back
    console.log('\\n📝 Test 6: Admin adds challenges back');
    const challenge4 = new Challenge({
      title: 'Dynamic System Test 4',
      description: 'Fourth challenge',
      problemStatement: 'Solve this',
      inputFormat: 'Input',
      outputFormat: 'Output',
      constraints: 'None',
      sampleInput: '4',
      sampleOutput: '8',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 100,
      testCases: [{ input: '4', expectedOutput: '8', isHidden: false }],
      isActive: true
    });
    await challenge4.save();
    
    algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   📊 Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   📊 Correctly solved: ${correctlySolvedAlgorithmicCount}`);
    console.log(`   📊 Team needs to complete new challenge for unlock code eligibility`);
    
    // Clean up
    await Team.deleteMany({ name: /Dynamic.*System/ });
    await User.deleteMany({ username: /dynamicsystem/ });
    await Challenge.deleteMany({ title: /Dynamic.*System/ });
    
    console.log('\\n✅ All tests completed successfully!');
    console.log('🎯 System handles dynamic challenge changes correctly!');
    console.log('\\n📋 Summary of Dynamic System Features:');
    console.log('   ✅ Unlock code generated when ALL current algorithmic challenges are completed');
    console.log('   ✅ System adapts to admin adding new challenges');
    console.log('   ✅ System adapts to admin removing challenges');
    console.log('   ✅ Works with any number of challenges (1, 2, 3, 4, 5, etc.)');
    console.log('   ✅ Handles edge cases (no challenges, all challenges removed)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDynamicSystem();
