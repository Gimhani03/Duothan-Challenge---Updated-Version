const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function checkCodeFighters() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('Connected to database');
    
    const team = await Team.findOne({ name: 'CODE FIGHTERS' }).populate('completedChallenges.challengeId');
    
    if (!team) {
      console.log('❌ CODE FIGHTERS team not found');
      return;
    }
    
    console.log('\n📋 CODE FIGHTERS Team Status:');
    console.log(`- Points: ${team.points}`);
    console.log(`- Completed challenges: ${team.completedChallenges.length}`);
    console.log(`- Unlock code: ${team.buildathonUnlockCode || 'None'}`);
    console.log(`- Required challenges: ${team.requiredChallenges?.length || 'Not set'}`);
    console.log(`- Buildathon unlocked: ${team.buildathonUnlocked}`);
    
    console.log('\n📊 Challenge Completions:');
    team.completedChallenges.forEach((cc, index) => {
      const title = cc.challengeId?.title || 'Unknown';
      const status = cc.isCorrect ? '✅ Correct' : '❌ Incorrect';
      const points = cc.points || 0;
      console.log(`  ${index + 1}. ${title}: ${status} (${points} points)`);
    });
    
    // Check versioned requirements
    console.log('\n🎯 Versioned Requirements:');
    if (team.requiredChallenges && team.requiredChallenges.length > 0) {
      team.requiredChallenges.forEach((rc, index) => {
        console.log(`  ${index + 1}. ${rc.challengeTitle}`);
      });
    } else {
      console.log('❌ No versioned requirements - needs migration');
    }
    
    // Check if eligible for unlock code
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const correctlySolvedIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());
    
    const correctCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`\n🔍 Analysis:`);
    console.log(`- Correctly solved: ${correctCount}/${algorithmicChallenges.length} algorithmic challenges`);
    
    if (correctCount === algorithmicChallenges.length && !team.buildathonUnlockCode) {
      console.log('⚠️  ISSUE: Team should have unlock code but doesn\'t!');
      
      // Try to fix
      console.log('🔧 Attempting to fix...');
      const result = await team.checkAndGenerateUnlockCode();
      if (result) {
        console.log('✅ Fixed! Generated unlock code');
        const updated = await Team.findById(team._id);
        console.log(`New unlock code: ${updated.buildathonUnlockCode}`);
      } else {
        console.log('❌ Could not generate unlock code');
      }
    } else if (correctCount < algorithmicChallenges.length) {
      console.log(`ℹ️  Team needs ${algorithmicChallenges.length - correctCount} more correct solutions`);
    } else {
      console.log('✅ Team status is correct');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCodeFighters();
