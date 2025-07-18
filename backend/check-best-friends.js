const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function checkBestFriendsTeam() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan');
    
    const team = await Team.findOne({ name: 'Best Friends' }).populate('completedChallenges.challengeId');
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    console.log('📊 Best Friends Team Status:');
    console.log(`  - Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`  - Team completed challenges: ${team.completedChallenges.length}`);
    console.log(`  - Team points: ${team.points}`);
    console.log(`  - Buildathon unlock code: ${team.buildathonUnlockCode || 'None'}`);
    
    console.log('\n📋 Algorithmic Challenges:');
    algorithmicChallenges.forEach((challenge, index) => {
      const completion = team.completedChallenges.find(cc => 
        cc.challengeId && cc.challengeId._id.toString() === challenge._id.toString()
      );
      
      console.log(`  ${index + 1}. ${challenge.title}:`);
      console.log(`     - Completed: ${completion ? 'Yes' : 'No'}`);
      console.log(`     - Correct: ${completion?.isCorrect ? 'Yes' : 'No'}`);
      console.log(`     - Points: ${challenge.points}`);
      console.log(`     - Challenge ID: ${challenge._id}`);
    });
    
    console.log('\n📈 Team Progress:');
    const correctlySolved = team.completedChallenges.filter(cc => 
      cc.challengeId && cc.challengeId.type === 'algorithmic' && cc.isCorrect
    ).length;
    console.log(`  - Correctly solved: ${correctlySolved}/${algorithmicChallenges.length}`);
    console.log(`  - Needs to complete: ${algorithmicChallenges.length - correctlySolved} more challenges`);
    
    if (correctlySolved === algorithmicChallenges.length) {
      console.log('\n🎉 Team qualifies for buildathon unlock code!');
      const codeGenerated = await team.checkAndGenerateUnlockCode();
      console.log(`  - Code generated: ${codeGenerated}`);
      
      const updatedTeam = await Team.findById(team._id);
      console.log(`  - New unlock code: ${updatedTeam.buildathonUnlockCode || 'None'}`);
    } else {
      console.log('\n⏳ Team needs to complete more challenges to get unlock code');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkBestFriendsTeam();
