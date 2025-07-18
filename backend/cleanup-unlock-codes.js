const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const UnlockCodeManager = require('./utils/unlockCodeManager');

require('dotenv').config();

async function cleanupAndFixUnlockCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Connected to MongoDB');

    console.log('\n🧹 Cleanup and Fix Unlock Codes');
    console.log('=================================\n');

    // Get all teams and challenges
    const teams = await Team.find({ isActive: true }).populate('completedChallenges.challengeId');
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    console.log(`📊 Found ${teams.length} teams and ${algorithmicChallenges.length} algorithmic challenges`);

    let fixedTeams = 0;
    let removedCodes = 0;
    let addedCodes = 0;

    for (const team of teams) {
      const correctlySolvedAlgorithmic = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      ).length;
      
      const shouldHaveCode = algorithmicChallenges.length > 0 && 
                            correctlySolvedAlgorithmic === algorithmicChallenges.length;
      
      console.log(`\n📋 Processing team: ${team.name}`);
      console.log(`   - Algorithmic progress: ${correctlySolvedAlgorithmic}/${algorithmicChallenges.length}`);
      console.log(`   - Should have code: ${shouldHaveCode}`);
      console.log(`   - Current code: ${team.buildathonUnlockCode || 'None'}`);

      if (shouldHaveCode && !team.buildathonUnlockCode) {
        // Team should have code but doesn't
        const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
        team.buildathonUnlockCode = unlockCode;
        await team.save();
        
        console.log(`   ✅ Added unlock code: ${unlockCode}`);
        addedCodes++;
        fixedTeams++;
        
      } else if (!shouldHaveCode && team.buildathonUnlockCode) {
        // Team has code but shouldn't
        team.buildathonUnlockCode = undefined;
        await team.save();
        
        console.log(`   🗑️ Removed invalid unlock code`);
        removedCodes++;
        fixedTeams++;
        
      } else {
        console.log(`   ⭕ No changes needed`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Teams processed: ${teams.length}`);
    console.log(`   - Teams fixed: ${fixedTeams}`);
    console.log(`   - Codes added: ${addedCodes}`);
    console.log(`   - Codes removed: ${removedCodes}`);

    // Verify the fix
    console.log(`\n🔍 Verification:`);
    const verificationTeams = await Team.find({ isActive: true }).populate('completedChallenges.challengeId');
    
    for (const team of verificationTeams) {
      const correctlySolvedAlgorithmic = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
      ).length;
      
      const shouldHaveCode = algorithmicChallenges.length > 0 && 
                            correctlySolvedAlgorithmic === algorithmicChallenges.length;
      
      const status = shouldHaveCode && team.buildathonUnlockCode ? '✅ Correct' : 
                    shouldHaveCode && !team.buildathonUnlockCode ? '❌ Missing code' : 
                    !shouldHaveCode && team.buildathonUnlockCode ? '⚠️ Invalid code' : 
                    '⭕ In progress';
      
      console.log(`   - ${team.name}: ${status}`);
    }

    // Final system status
    console.log(`\n📊 Final system status:`);
    const finalStatus = await UnlockCodeManager.getSystemStatus();
    console.log(`   - Total teams: ${finalStatus.totalTeams}`);
    console.log(`   - Teams with codes: ${finalStatus.teamsWithCodes}`);
    console.log(`   - Teams without codes: ${finalStatus.teamsWithoutCodes}`);
    console.log(`   - System health: ${finalStatus.systemHealth}%`);

    console.log('\n✅ Cleanup and fix completed successfully!');
    console.log('=================================\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupAndFixUnlockCodes();
