const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/duothan-challenge', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCompletionUnlock() {
  try {
    console.log('🧪 Testing completion-based unlock code generation...');
    
    // Find a team to test
    const team = await Team.findOne({ name: 'CODE FIGHTERS' })
      .populate('completedChallenges.challengeId');
    
    if (!team) {
      console.log('❌ CODE FIGHTERS team not found');
      return;
    }
    
    console.log(`\n📊 Testing team: ${team.name}`);
    console.log(`   - Team ID: ${team._id}`);
    console.log(`   - Current unlock code: ${team.buildathonUnlockCode || 'None'}`);
    console.log(`   - Completed challenges: ${team.completedChallenges.length}`);
    
    // Clear unlock code for testing
    team.buildathonUnlockCode = null;
    await team.save();
    
    // Check what challenges are completed
    const completedChallenges = team.completedChallenges.filter(cc => cc.challengeId !== null);
    console.log(`\n🔍 Completed challenges:`);
    completedChallenges.forEach((cc, index) => {
      console.log(`   ${index + 1}. ${cc.challengeId.title} - ${cc.isCorrect ? 'Correct' : 'Incorrect'}`);
    });
    
    // Test unlock code generation
    const codeGenerated = await team.checkAndGenerateUnlockCode();
    
    console.log(`\n🎯 Result: ${codeGenerated ? 'Code generated' : 'No code generated'}`);
    
    // Reload team to see if code was generated
    const updatedTeam = await Team.findById(team._id);
    console.log(`   - New unlock code: ${updatedTeam.buildathonUnlockCode || 'None'}`);
    
    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const express = require('express');
    const request = require('supertest');
    const app = express();
    
    // Simple test of the logic
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const completedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    const completedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`   - Total algorithmic challenges: ${algorithmicChallenges.length}`);
    console.log(`   - Completed algorithmic challenges: ${completedAlgorithmicCount}`);
    console.log(`   - Eligible for unlock: ${completedAlgorithmicCount === algorithmicChallenges.length ? 'Yes' : 'No'}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCompletionUnlock();
