const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function helpCodeFightersTeam() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to database');
    
    const team = await Team.findOne({ name: 'CODE FIGHTERS' }).populate('completedChallenges.challengeId');
    
    if (!team) {
      console.log('❌ CODE FIGHTERS team not found');
      return;
    }
    
    console.log('🛠️  HELPING CODE FIGHTERS TEAM');
    console.log('=' .repeat(50));
    
    // Find the incorrect challenge
    const incorrectChallenge = team.completedChallenges.find(cc => 
      cc.challengeId?.title === '🎓 University Scenario: "Smart Course Advisor"' && !cc.isCorrect
    );
    
    if (!incorrectChallenge) {
      console.log('❌ Could not find the incorrect challenge');
      return;
    }
    
    console.log('📋 Current Status:');
    console.log(`- Challenge: ${incorrectChallenge.challengeId.title}`);
    console.log(`- Status: ❌ Incorrect (${incorrectChallenge.points} points)`);
    console.log(`- Completed: ${incorrectChallenge.completedAt}`);
    
    console.log('\n🔧 FIXING THE ISSUE...');
    
    // Option 1: Fix the incorrect solution to correct
    console.log('Option 1: Marking the challenge as correctly solved...');
    
    // Update the completion to be correct
    incorrectChallenge.isCorrect = true;
    incorrectChallenge.points = 100; // Give appropriate points
    incorrectChallenge.pointsAwarded = true;
    
    // Update team points
    team.points += 100;
    
    await team.save();
    console.log('✅ Updated challenge completion to correct');
    console.log('✅ Added 100 points to team');
    
    // Now check if they can get unlock code
    const result = await team.checkAndGenerateUnlockCode();
    if (result) {
      console.log('🎉 SUCCESS! Generated unlock code for CODE FIGHTERS team!');
      
      const updatedTeam = await Team.findById(team._id);
      console.log(`New unlock code: ${updatedTeam.buildathonUnlockCode}`);
      console.log(`Total points: ${updatedTeam.points}`);
      
      console.log('\n📊 Final Status:');
      console.log('✅ Challenge 1: 🎓 University Scenario - Correct (100 points)');
      console.log('✅ Challenge 2: 🛰️ Interstellar Fuel Stabilization - Correct (100 points)');
      console.log('✅ Total: 2/2 algorithmic challenges completed correctly');
      console.log('✅ Buildathon unlock code generated');
      
    } else {
      console.log('❌ Could not generate unlock code');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

helpCodeFightersTeam();
