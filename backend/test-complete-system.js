const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const User = require('./models/User');
const Submission = require('./models/Submission');
const UnlockCodeManager = require('./utils/unlockCodeManager');

require('dotenv').config();

async function testBuildathonCompletionSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Connected to MongoDB');

    console.log('\n🎯 Testing Complete Buildathon Unlock Code System');
    console.log('===================================================\n');

    // 1. Get current system status
    console.log('📊 1. Current System Status:');
    const status = await UnlockCodeManager.getSystemStatus();
    console.log(`   - Total teams: ${status.totalTeams}`);
    console.log(`   - Teams with codes: ${status.teamsWithCodes}`);
    console.log(`   - Teams without codes: ${status.teamsWithoutCodes}`);
    console.log(`   - Algorithmic challenges: ${status.algorithmicChallenges}`);
    console.log(`   - System health: ${status.systemHealth}%`);

    // 2. Test specific teams
    console.log('\n🧪 2. Testing Specific Teams:');
    const teams = await Team.find({ isActive: true }).populate('completedChallenges.challengeId');
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    for (const team of teams) {
      const correctlySolvedAlgorithmic = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      ).length;
      
      const shouldHaveCode = algorithmicChallenges.length > 0 && 
                            correctlySolvedAlgorithmic === algorithmicChallenges.length;
      
      console.log(`\n   📋 Team: ${team.name}`);
      console.log(`      - Algorithmic progress: ${correctlySolvedAlgorithmic}/${algorithmicChallenges.length}`);
      console.log(`      - Should have unlock code: ${shouldHaveCode}`);
      console.log(`      - Has unlock code: ${!!team.buildathonUnlockCode}`);
      console.log(`      - Unlock code: ${team.buildathonUnlockCode || 'None'}`);
      console.log(`      - Buildathon unlocked: ${team.buildathonUnlocked}`);
      console.log(`      - Total points: ${team.points}`);
      
      const status = shouldHaveCode && team.buildathonUnlockCode ? '✅ Ready for buildathon' : 
                    shouldHaveCode && !team.buildathonUnlockCode ? '❌ Missing unlock code' : 
                    !shouldHaveCode && team.buildathonUnlockCode ? '⚠️ Premature unlock code' : 
                    '⭕ In progress';
      
      console.log(`      - Status: ${status}`);
    }

    // 3. Test team creation scenario
    console.log('\n🆕 3. Testing Team Creation Scenario:');
    const newTeamData = {
      name: `NewTeam_${Date.now()}`,
      description: 'Test team for dynamic unlock code system',
      leader: null,
      members: [],
      maxMembers: 4
    };

    // Create or find a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
      await testUser.save();
    }

    newTeamData.leader = testUser._id;
    newTeamData.members = [testUser._id];

    const newTeam = new Team(newTeamData);
    await newTeam.save();
    
    console.log(`   - Created team: ${newTeam.name}`);
    console.log(`   - Unlock code after creation: ${newTeam.buildathonUnlockCode || 'None'}`);
    
    // Simulate completing all algorithmic challenges
    console.log('\n   🎯 Simulating completion of all algorithmic challenges:');
    for (const challenge of algorithmicChallenges) {
      newTeam.completedChallenges.push({
        challengeId: challenge._id,
        completedAt: new Date(),
        points: challenge.points,
        isCorrect: true,
        pointsAwarded: true
      });
      newTeam.points += challenge.points;
    }
    await newTeam.save();
    
    console.log(`   - Added ${algorithmicChallenges.length} completed challenges`);
    console.log(`   - Team points: ${newTeam.points}`);
    
    // Check if unlock code gets generated
    const codeGenerated = await newTeam.checkAndGenerateUnlockCode();
    console.log(`   - Code generated: ${codeGenerated}`);
    
    // Refresh team data
    const updatedTeam = await Team.findById(newTeam._id);
    console.log(`   - Final unlock code: ${updatedTeam.buildathonUnlockCode || 'None'}`);

    // 4. Test admin challenge addition scenario
    console.log('\n🔧 4. Testing Admin Challenge Addition:');
    const newChallenge = new Challenge({
      title: `Test Challenge ${Date.now()}`,
      description: 'A test algorithmic challenge',
      problemStatement: 'Solve this test problem',
      inputFormat: 'Single integer',
      outputFormat: 'Single integer',
      constraints: '1 <= n <= 100',
      sampleInput: '5',
      sampleOutput: '5',
      explanation: 'Return the input',
      type: 'algorithmic',
      difficulty: 'easy',
      points: 50,
      testCases: [{
        input: '5',
        expectedOutput: '5',
        isHidden: false
      }],
      isActive: true
    });
    
    await newChallenge.save();
    console.log(`   - Created new algorithmic challenge: ${newChallenge.title}`);
    
    // Check if teams with unlock codes now lose them (they should)
    const teamsBeforeCheck = await Team.find({ buildathonUnlockCode: { $exists: true } });
    console.log(`   - Teams with unlock codes before check: ${teamsBeforeCheck.length}`);
    
    // Run the check
    const codesAffected = await UnlockCodeManager.checkAllTeams();
    console.log(`   - Teams affected by new challenge: ${codesAffected}`);
    
    const teamsAfterCheck = await Team.find({ buildathonUnlockCode: { $exists: true } });
    console.log(`   - Teams with unlock codes after check: ${teamsAfterCheck.length}`);
    
    // Remove the test challenge
    await Challenge.findByIdAndDelete(newChallenge._id);
    console.log(`   - Removed test challenge`);
    
    // Re-check teams
    const codesRestored = await UnlockCodeManager.checkAllTeams();
    console.log(`   - Teams restored after challenge removal: ${codesRestored}`);

    // 5. Test submission-based unlock code generation
    console.log('\n📝 5. Testing Submission-Based Unlock Code Generation:');
    const testTeam = await Team.findOne({ name: 'Best Friends' });
    if (testTeam) {
      console.log(`   - Testing team: ${testTeam.name}`);
      
      // Get remaining challenges
      const remainingChallenges = algorithmicChallenges.filter(challenge => 
        !testTeam.completedChallenges.some(cc => 
          cc.challengeId && cc.challengeId.toString() === challenge._id.toString()
        )
      );
      
      console.log(`   - Remaining challenges: ${remainingChallenges.length}`);
      
      if (remainingChallenges.length > 0) {
        const challenge = remainingChallenges[0];
        console.log(`   - Completing challenge: ${challenge.title}`);
        
        // Add completion
        testTeam.completedChallenges.push({
          challengeId: challenge._id,
          completedAt: new Date(),
          points: challenge.points,
          isCorrect: true,
          pointsAwarded: true
        });
        testTeam.points += challenge.points;
        await testTeam.save();
        
        // Check if unlock code gets generated
        const codeGenerated = await testTeam.checkAndGenerateUnlockCode();
        console.log(`   - Code generated: ${codeGenerated}`);
        
        const refreshedTeam = await Team.findById(testTeam._id);
        console.log(`   - New unlock code: ${refreshedTeam.buildathonUnlockCode || 'None'}`);
      }
    }

    // 6. Clean up
    console.log('\n🧹 6. Cleaning up:');
    await Team.findByIdAndDelete(newTeam._id);
    console.log(`   - Removed test team: ${newTeam.name}`);

    // 7. Final system status
    console.log('\n📊 7. Final System Status:');
    const finalStatus = await UnlockCodeManager.getSystemStatus();
    console.log(`   - Total teams: ${finalStatus.totalTeams}`);
    console.log(`   - Teams with codes: ${finalStatus.teamsWithCodes}`);
    console.log(`   - Teams without codes: ${finalStatus.teamsWithoutCodes}`);
    console.log(`   - System health: ${finalStatus.systemHealth}%`);

    console.log('\n✅ Complete system test finished successfully!');
    console.log('===================================================\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the comprehensive test
testBuildathonCompletionSystem();
