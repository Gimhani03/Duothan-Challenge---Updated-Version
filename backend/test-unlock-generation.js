const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const UnlockCodeManager = require('./utils/unlockCodeManager');

require('dotenv').config();

async function testUnlockCodeGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/duothan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Connected to MongoDB');

    console.log('\n🧪 Testing Unlock Code Generation');
    console.log('==================================\n');

    // Test the checkAndGenerateUnlockCode method for specific teams
    const testTeams = ['CodeGen', 'CODEX', 'Best Friends'];
    
    for (const teamName of testTeams) {
      const team = await Team.findOne({ name: teamName });
      if (team) {
        console.log(`\n📋 Testing team: ${teamName}`);
        console.log(`   - Current unlock code: ${team.buildathonUnlockCode || 'None'}`);
        
        const codeGenerated = await team.checkAndGenerateUnlockCode();
        console.log(`   - Code generation result: ${codeGenerated}`);
        
        // Refresh team data
        const refreshedTeam = await Team.findById(team._id);
        console.log(`   - Updated unlock code: ${refreshedTeam.buildathonUnlockCode || 'None'}`);
      }
    }

    // Test the static method
    console.log('\n🔄 Testing static method checkAllTeamsForUnlockCodes...');
    const codesGenerated = await Team.checkAllTeamsForUnlockCodes();
    console.log(`Generated ${codesGenerated} unlock codes`);

    console.log('\n✅ Test completed successfully!');
    console.log('==================================\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testUnlockCodeGeneration();
