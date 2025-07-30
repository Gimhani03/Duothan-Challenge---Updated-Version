const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function checkCodeFightersTeam() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to database');
    
    // Find CODE FIGHTERS team
    const team = await Team.findOne({ name: 'CODE FIGHTERS', isActive: true }).populate('completedChallenges.challengeId');
    
    if (!team) {
      console.log('❌ CODE FIGHTERS team not found');
      return;
    }
    
    console.log('\n📋 CODE FIGHTERS Team Analysis:');
    console.log('=' .repeat(50));
    console.log(`Team ID: ${team._id}`);
    console.log(`Created: ${team.createdAt}`);
    console.log(`Members: ${team.members.length}`);
    console.log(`Points: ${team.points}`);
    console.log(`Completed Challenges: ${team.completedChallenges.length}`);
    console.log(`Required Challenges: ${team.requiredChallenges?.length || 'Not set'}`);
    console.log(`Unlock Code: ${team.buildathonUnlockCode || 'None'}`);
    console.log(`Buildathon Unlocked: ${team.buildathonUnlocked}`);
    
    // Check versioned requirements
    console.log('\n🎯 Versioned Requirements:');
    if (team.requiredChallenges && team.requiredChallenges.length > 0) {
      console.log('Required Challenges:');
      team.requiredChallenges.forEach((rc, index) => {
        console.log(`  ${index + 1}. ${rc.challengeTitle} (Added: ${rc.addedAt})`);
      });
    } else {
      console.log('❌ No versioned requirements set');
    }
    
    // Check completions
    console.log('\n✅ Challenge Completions:');
    if (team.completedChallenges.length > 0) {
      team.completedChallenges.forEach((cc, index) => {
        const title = cc.challengeId?.title || 'Unknown Challenge';
        const status = cc.isCorrect ? '✅ Correct' : '❌ Incorrect';
        const points = cc.points || 0;
        console.log(`  ${index + 1}. ${title}: ${status} (${points} points)`);
      });
    } else {
      console.log('❌ No challenges completed');
    }
    
    // Check current algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`\n📊 Current Algorithmic Challenges: ${algorithmicChallenges.length}`);
    algorithmicChallenges.forEach((challenge, index) => {
      console.log(`  ${index + 1}. ${challenge.title}`);
    });
    
    // Check if should have unlock code
    const correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());
    
    const correctlySolvedCount = algorithmicChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`\n🔍 Analysis:`);
    console.log(`Correctly solved algorithmic challenges: ${correctlySolvedCount}/${algorithmicChallenges.length}`);
    
    if (correctlySolvedCount === algorithmicChallenges.length && !team.buildathonUnlockCode) {
      console.log('⚠️  ISSUE DETECTED: Team should have unlock code but doesn\'t!');
      console.log('🔧 Attempting to fix...');
      
      // Try to generate unlock code
      const codeGenerated = await team.checkAndGenerateUnlockCode();
      if (codeGenerated) {
        console.log('✅ Unlock code generated successfully!');
        const updatedTeam = await Team.findById(team._id);
        console.log(`New unlock code: ${updatedTeam.buildathonUnlockCode}`);
      } else {
        console.log('❌ Failed to generate unlock code');
      }
    } else if (correctlySolvedCount < algorithmicChallenges.length) {
      console.log('ℹ️  Team needs to complete more challenges to get unlock code');
      console.log(`   Missing: ${algorithmicChallenges.length - correctlySolvedCount} challenges`);
    } else {
      console.log('✅ Team status is correct');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCodeFightersTeam();
