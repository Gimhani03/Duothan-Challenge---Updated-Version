const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const User = require('./models/User');
const UnlockCodeManager = require('./utils/unlockCodeManager');

require('dotenv').config();

async function testDynamicUnlockSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Connected to MongoDB');

    console.log('\n🧪 Testing Dynamic Unlock Code System');
    console.log('=====================================\n');

    // 1. Test system status
    console.log('📊 1. Getting system status...');
    const status = await UnlockCodeManager.getSystemStatus();
    console.log('System Status:', status);

    // 2. Test initialization
    console.log('\n🚀 2. Testing initialization...');
    const codesGenerated = await UnlockCodeManager.initialize();
    console.log(`Generated ${codesGenerated} unlock codes during initialization`);

    // 3. Test individual team check
    console.log('\n👥 3. Testing individual team checks...');
    const teams = await Team.find({ isActive: true }).limit(3);
    for (const team of teams) {
      console.log(`\n📋 Checking team: ${team.name}`);
      console.log(`   - Current unlock code: ${team.buildathonUnlockCode || 'None'}`);
      
      const codeGenerated = await UnlockCodeManager.checkTeam(team._id);
      console.log(`   - Code generated: ${codeGenerated}`);
      
      // Refresh team data
      await team.populate('completedChallenges.challengeId');
      const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
      const correctlySolvedChallenges = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      );
      
      console.log(`   - Algorithmic challenges: ${algorithmicChallenges.length}`);
      console.log(`   - Correctly solved: ${correctlySolvedChallenges.length}`);
      console.log(`   - Final unlock code: ${team.buildathonUnlockCode || 'None'}`);
    }

    // 4. Test team creation scenario
    console.log('\n🆕 4. Testing team creation scenario...');
    const newTeamData = {
      name: `TestTeam_${Date.now()}`,
      description: 'Test team for unlock code system',
      leader: null,
      members: [],
      maxMembers: 4
    };

    // Create a test user if needed
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

    // Test unlock code generation for new team
    const newTeamCodeGenerated = await newTeam.checkAndGenerateUnlockCode();
    console.log(`   - Code generated for new team: ${newTeamCodeGenerated}`);
    console.log(`   - New team unlock code: ${newTeam.buildathonUnlockCode || 'None'}`);

    // 5. Test force regeneration
    console.log('\n🔄 5. Testing force regeneration...');
    const forceGenerated = await UnlockCodeManager.forceRegenerateAll();
    console.log(`Force regenerated ${forceGenerated} unlock codes`);

    // 6. Final system status
    console.log('\n📊 6. Final system status...');
    const finalStatus = await UnlockCodeManager.getSystemStatus();
    console.log('Final Status:', finalStatus);

    // 7. Test specific team scenarios
    console.log('\n🧮 7. Testing specific scenarios...');
    
    // Find teams with different completion states
    const allTeams = await Team.find({ isActive: true }).populate('completedChallenges.challengeId');
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    console.log(`\n📊 Analysis of all teams:`);
    console.log(`Total algorithmic challenges: ${algorithmicChallenges.length}`);
    
    for (const team of allTeams) {
      const correctlySolvedAlgorithmic = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      ).length;
      
      const shouldHaveCode = algorithmicChallenges.length > 0 && 
                            correctlySolvedAlgorithmic === algorithmicChallenges.length;
      
      console.log(`   - ${team.name}:`);
      console.log(`     • Correctly solved algorithmic: ${correctlySolvedAlgorithmic}/${algorithmicChallenges.length}`);
      console.log(`     • Should have unlock code: ${shouldHaveCode}`);
      console.log(`     • Has unlock code: ${!!team.buildathonUnlockCode}`);
      console.log(`     • Code: ${team.buildathonUnlockCode || 'None'}`);
      console.log(`     • Status: ${shouldHaveCode && team.buildathonUnlockCode ? '✅ Correct' : 
                                    shouldHaveCode && !team.buildathonUnlockCode ? '❌ Missing code' : 
                                    !shouldHaveCode && team.buildathonUnlockCode ? '⚠️ Unexpected code' : 
                                    '⭕ No code needed'}`);
    }

    // Clean up test team
    await Team.findByIdAndDelete(newTeam._id);
    console.log(`\n🧹 Cleaned up test team: ${newTeam.name}`);

    console.log('\n✅ Dynamic unlock code system test completed successfully!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDynamicUnlockSystem();
