const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

async function checkCodeFightersIssue() {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to database');
    
    console.log('🔍 Searching for Code Fighters team...');
    
    // Search for teams with similar names (case insensitive)
    const teams = await Team.find({ 
      isActive: true,
      $or: [
        { name: { $regex: /code.*fighter/i } },
        { name: { $regex: /fighter.*code/i } },
        { name: { $regex: /codefighter/i } },
        { name: { $regex: /code fighter/i } }
      ]
    }).populate('completedChallenges.challengeId');
    
    if (teams.length === 0) {
      console.log('❌ No team found with "Code Fighters" or similar name');
      
      // Let's check all teams to see what's available
      const allTeams = await Team.find({ isActive: true });
      console.log('\n📊 All active teams:');
      allTeams.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name}`);
      });
      
      // Also check for any team that might be having issues
      console.log('\n🔍 Teams without unlock codes:');
      const teamsWithoutCodes = await Team.find({ 
        isActive: true, 
        $or: [
          { buildathonUnlockCode: { $exists: false } },
          { buildathonUnlockCode: null }
        ]
      });
      
      console.log(`Found ${teamsWithoutCodes.length} teams without unlock codes:`);
      teamsWithoutCodes.forEach(team => {
        console.log(`  - ${team.name}: ${team.completedChallenges.length} challenges completed`);
      });
      
    } else {
      console.log(`✅ Found ${teams.length} matching team(s):`);
      
      for (const team of teams) {
        console.log(`\n📋 Team: ${team.name}`);
        console.log(`   - ID: ${team._id}`);
        console.log(`   - Created: ${team.createdAt}`);
        console.log(`   - Members: ${team.members.length}`);
        console.log(`   - Points: ${team.points}`);
        console.log(`   - Completed Challenges: ${team.completedChallenges.length}`);
        console.log(`   - Required Challenges: ${team.requiredChallenges?.length || 'Not set'}`);
        console.log(`   - Unlock Code: ${team.buildathonUnlockCode || 'None'}`);
        console.log(`   - Buildathon Unlocked: ${team.buildathonUnlocked}`);
        
        // Check versioned requirements
        if (team.requiredChallenges && team.requiredChallenges.length > 0) {
          console.log('   - Required Challenges:');
          team.requiredChallenges.forEach(rc => {
            console.log(`     * ${rc.challengeTitle} (Added: ${rc.addedAt})`);
          });
        }
        
        // Check challenge completion details
        if (team.completedChallenges.length > 0) {
          console.log('   - Challenge Completion Details:');
          team.completedChallenges.forEach(cc => {
            const title = cc.challengeId?.title || 'Unknown Challenge';
            const status = cc.isCorrect ? '✅ Correct' : '❌ Incorrect';
            const points = cc.points || 0;
            console.log(`     * ${title}: ${status} (${points} points)`);
          });
        }
        
        // Check if team should have unlock code
        const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
        const correctlySolvedChallengeIds = team.completedChallenges
          .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
          .map(cc => cc.challengeId._id.toString());
        
        const correctlySolvedCount = algorithmicChallenges.filter(challenge => 
          correctlySolvedChallengeIds.includes(challenge._id.toString())
        ).length;
        
        console.log(`   - Correctly solved algorithmic challenges: ${correctlySolvedCount}/${algorithmicChallenges.length}`);
        
        if (correctlySolvedCount === algorithmicChallenges.length && !team.buildathonUnlockCode) {
          console.log('   ⚠️  ISSUE: Team should have unlock code but doesn\'t!');
        }
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCodeFightersIssue();
