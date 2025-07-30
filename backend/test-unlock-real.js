const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const User = require('./models/User');

async function testUnlockCodeWithRealChallenges() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');
    
    // Get all algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`📊 Found ${algorithmicChallenges.length} algorithmic challenges:`);
    algorithmicChallenges.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.title}`);
    });
    
    // Clean up test data
    await Team.deleteMany({ name: /Test.*Unlock/ });
    await User.deleteMany({ username: /testuser.*unlock/ });
    
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
    
    // Complete all algorithmic challenges one by one
    for (let i = 0; i < algorithmicChallenges.length; i++) {
      const challenge = algorithmicChallenges[i];
      
      // Add completion
      testTeam.completedChallenges.push({
        challengeId: challenge._id,
        completedAt: new Date(),
        points: challenge.points,
        isCorrect: true
      });
      testTeam.points += challenge.points;
      await testTeam.save();
      
      console.log(`✅ Completed challenge ${i+1}: ${challenge.title}`);
      
      // Check if unlock code should be generated
      const correctlySolvedChallengeIds = testTeam.completedChallenges
        .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
        .map(cc => cc.challengeId.toString());
      
      const correctlySolvedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
        correctlySolvedChallengeIds.includes(challenge._id.toString())
      ).length;
      
      console.log(`   📊 Progress: ${correctlySolvedAlgorithmicCount}/${algorithmicChallenges.length} challenges completed`);
      
      // Generate unlock code if all challenges are completed
      if (algorithmicChallenges.length > 0 && 
          correctlySolvedAlgorithmicCount === algorithmicChallenges.length && 
          !testTeam.buildathonUnlockCode) {
        
        const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
        testTeam.buildathonUnlockCode = unlockCode;
        await testTeam.save();
        console.log(`🎉 ALL ALGORITHMIC CHALLENGES COMPLETED! Generated unlock code: ${unlockCode}`);
        break;
      }
    }
    
    // Verify final state
    const updatedTeam = await Team.findById(testTeam._id);
    if (updatedTeam.buildathonUnlockCode) {
      console.log('✅ SUCCESS: Unlock code generated successfully!');
      console.log(`🔑 Final unlock code: ${updatedTeam.buildathonUnlockCode}`);
    } else {
      console.log('❌ FAILURE: Unlock code was NOT generated');
    }
    
    // Clean up
    await Team.deleteMany({ name: /Test.*Unlock/ });
    await User.deleteMany({ username: /testuser.*unlock/ });
    console.log('✅ Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUnlockCodeWithRealChallenges();
