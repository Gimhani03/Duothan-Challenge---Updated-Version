const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function helpBestFriendsComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan');
    
    const team = await Team.findOne({ name: 'Best Friends' });
    const challenge = await Challenge.findOne({ title: /Interstellar Fuel Stabilization/ });
    
    console.log('🔧 Helping Best Friends complete the second challenge...');
    console.log(`  - Team: ${team.name}`);
    console.log(`  - Challenge: ${challenge.title}`);
    
    // Find the existing completion record
    const existingCompletion = team.completedChallenges.find(cc => 
      cc.challengeId.toString() === challenge._id.toString()
    );
    
    if (existingCompletion) {
      console.log('  - Found existing completion record');
      console.log(`  - Current status: ${existingCompletion.isCorrect ? 'Correct' : 'Incorrect'}`);
      
      // Update the completion to be correct
      existingCompletion.isCorrect = true;
      if (!existingCompletion.pointsAwarded) {
        existingCompletion.pointsAwarded = true;
        team.points += challenge.points;
      }
      
      await team.save();
      
      console.log('  - Updated completion to correct');
      console.log(`  - New team points: ${team.points}`);
      
      // Check if they now qualify for unlock code
      const codeGenerated = await team.checkAndGenerateUnlockCode();
      console.log(`  - Code generated: ${codeGenerated}`);
      
      const updatedTeam = await Team.findById(team._id);
      console.log(`  - New unlock code: ${updatedTeam.buildathonUnlockCode || 'None'}`);
      
      if (updatedTeam.buildathonUnlockCode) {
        console.log('\n🎉 Best Friends team now has their buildathon unlock code!');
        console.log(`   Code: ${updatedTeam.buildathonUnlockCode}`);
        console.log(`   Points: ${updatedTeam.points}`);
      }
    } else {
      console.log('  - No existing completion record found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

helpBestFriendsComplete();
