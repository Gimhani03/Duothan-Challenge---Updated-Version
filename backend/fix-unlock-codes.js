const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const UnlockCodeManager = require('./utils/unlockCodeManager');

require('dotenv').config();

async function fixExistingTeams() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Connected to MongoDB');

    console.log('\n🔧 Fixing Existing Teams - Unlock Code System');
    console.log('==============================================\n');

    // Get system status before fixing
    console.log('📊 System status before fix:');
    const beforeStatus = await UnlockCodeManager.getSystemStatus();
    console.log(`   - Total teams: ${beforeStatus.totalTeams}`);
    console.log(`   - Teams with codes: ${beforeStatus.teamsWithCodes}`);
    console.log(`   - Teams without codes: ${beforeStatus.teamsWithoutCodes}`);
    console.log(`   - Algorithmic challenges: ${beforeStatus.algorithmicChallenges}`);
    console.log(`   - System health: ${beforeStatus.systemHealth}%`);

    // Fix all teams
    console.log('\n🔄 Running fix for all teams...');
    const codesGenerated = await UnlockCodeManager.initialize();
    console.log(`✅ Generated ${codesGenerated} unlock codes`);

    // Get system status after fixing
    console.log('\n📊 System status after fix:');
    const afterStatus = await UnlockCodeManager.getSystemStatus();
    console.log(`   - Total teams: ${afterStatus.totalTeams}`);
    console.log(`   - Teams with codes: ${afterStatus.teamsWithCodes}`);
    console.log(`   - Teams without codes: ${afterStatus.teamsWithoutCodes}`);
    console.log(`   - Algorithmic challenges: ${afterStatus.algorithmicChallenges}`);
    console.log(`   - System health: ${afterStatus.systemHealth}%`);

    // Show improvement
    const improvement = afterStatus.teamsWithCodes - beforeStatus.teamsWithCodes;
    console.log(`\n📈 Improvement: +${improvement} teams now have unlock codes`);

    // Show detailed team analysis
    console.log('\n📋 Detailed team analysis:');
    const teams = await Team.find({ isActive: true }).populate('completedChallenges.challengeId');
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    for (const team of teams) {
      const correctlySolvedAlgorithmic = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      ).length;
      
      const shouldHaveCode = algorithmicChallenges.length > 0 && 
                            correctlySolvedAlgorithmic === algorithmicChallenges.length;
      
      console.log(`   - ${team.name}:`);
      console.log(`     • Progress: ${correctlySolvedAlgorithmic}/${algorithmicChallenges.length} algorithmic challenges`);
      console.log(`     • Unlock code: ${team.buildathonUnlockCode || 'None'}`);
      console.log(`     • Status: ${shouldHaveCode && team.buildathonUnlockCode ? '✅ Ready for buildathon' : 
                                    shouldHaveCode && !team.buildathonUnlockCode ? '❌ Missing code (ERROR)' : 
                                    !shouldHaveCode && team.buildathonUnlockCode ? '⚠️ Premature code (ERROR)' : 
                                    '⭕ In progress'}`);
    }

    console.log('\n✅ Fix completed successfully!');
    console.log('==============================================\n');

  } catch (error) {
    console.error('❌ Error during fixing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixExistingTeams();
