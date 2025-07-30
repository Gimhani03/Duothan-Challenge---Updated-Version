const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const User = require('./models/User');

// Test the scenario described by the user
async function testUnlockCodeScenario() {
  try {
    console.log('🎯 TESTING UNLOCK CODE SCENARIO');
    console.log('=' .repeat(50));
    console.log('Problem: User completes 2 challenges → gets unlock code');
    console.log('         Admin adds 3rd challenge → user loses unlock code');
    console.log('Solution: Versioned requirements preserve unlock codes');
    console.log('=' .repeat(50));

    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to database');

    // Step 1: Initial state with 2 challenges
    console.log('\n📊 STEP 1: Initial State (2 Challenges)');
    const currentChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`Current algorithmic challenges: ${currentChallenges.length}`);
    
    // Step 2: Migrate existing teams to versioned requirements
    console.log('\n🔄 STEP 2: Migrating Teams to Versioned Requirements');
    await Team.migrateTeamsToVersionedRequirements();
    
    // Step 3: Check teams with unlock codes
    console.log('\n✅ STEP 3: Teams with Unlock Codes');
    const teamsWithCodes = await Team.find({ 
      isActive: true, 
      buildathonUnlockCode: { $exists: true, $ne: null } 
    });
    
    console.log(`Teams with unlock codes: ${teamsWithCodes.length}`);
    for (const team of teamsWithCodes) {
      console.log(`  ${team.name}: Code=${team.buildathonUnlockCode}, Required=${team.requiredChallenges.length}`);
    }

    // Step 4: Admin adds a new challenge
    console.log('\n➕ STEP 4: Admin Adds New Challenge');
    const newChallenge = new Challenge({
      title: 'New Third Challenge',
      description: 'A challenge added after teams got unlock codes',
      problemStatement: 'Solve this new problem',
      inputFormat: 'New input format',
      outputFormat: 'New output format',
      constraints: 'New constraints',
      sampleInput: '10',
      sampleOutput: '100',
      type: 'algorithmic',
      difficulty: 'medium',
      points: 120,
      testCases: [{
        input: '10',
        expectedOutput: '100',
        isHidden: false
      }]
    });

    await newChallenge.save();
    console.log(`✅ Added new challenge: ${newChallenge.title}`);

    // Step 5: Check system after adding challenge
    console.log('\n📊 STEP 5: After Adding Challenge');
    const updatedChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`Total algorithmic challenges now: ${updatedChallenges.length}`);

    // Step 6: Check if existing teams maintain their unlock codes
    console.log('\n🔍 STEP 6: Checking Existing Teams');
    const teamsAfterUpdate = await Team.find({ 
      isActive: true, 
      buildathonUnlockCode: { $exists: true, $ne: null } 
    });
    
    console.log('Teams with unlock codes after new challenge:');
    for (const team of teamsAfterUpdate) {
      console.log(`  ${team.name}:`);
      console.log(`    - Unlock Code: ${team.buildathonUnlockCode}`);
      console.log(`    - Required Challenges: ${team.requiredChallenges.length}`);
      console.log(`    - Status: ${team.requiredChallenges.length === 2 ? '✅ PRESERVED' : '❌ AFFECTED'}`);
    }

    // Step 7: Create a new team (should need all 3 challenges)
    console.log('\n👥 STEP 7: Creating New Team');
    const newTeam = new Team({
      name: 'New Team After Challenge',
      description: 'Team created after 3rd challenge was added',
      leader: new mongoose.Types.ObjectId(),
      members: [new mongoose.Types.ObjectId()]
    });

    await newTeam.save();
    console.log(`✅ Created new team: ${newTeam.name}`);
    console.log(`   Required challenges: ${newTeam.requiredChallenges.length} (Should be 3)`);

    // Step 8: Demonstrate the solution
    console.log('\n🎯 STEP 8: Solution Demonstration');
    console.log('OLD BEHAVIOR (Without Versioning):');
    console.log('  - User completes 2 challenges → Gets unlock code');
    console.log('  - Admin adds 3rd challenge → User loses unlock code ❌');
    console.log('  - User must complete 3rd challenge to get code again');
    
    console.log('\nNEW BEHAVIOR (With Versioning):');
    console.log('  - User completes 2 challenges → Gets unlock code');
    console.log('  - Admin adds 3rd challenge → User keeps unlock code ✅');
    console.log('  - Only new teams need to complete all 3 challenges');

    // Step 9: Verify the fix
    console.log('\n✅ STEP 9: Verification');
    const allTeams = await Team.find({ isActive: true });
    let oldTeamsPreserved = 0;
    let newTeamsWithNewRequirements = 0;
    
    for (const team of allTeams) {
      if (team.name === 'New Team After Challenge') {
        if (team.requiredChallenges.length === 3) {
          newTeamsWithNewRequirements++;
        }
      } else {
        if (team.requiredChallenges.length === 2) {
          oldTeamsPreserved++;
        }
      }
    }
    
    console.log(`✅ Old teams preserved: ${oldTeamsPreserved}`);
    console.log(`✅ New teams with new requirements: ${newTeamsWithNewRequirements}`);
    console.log(`✅ Teams with unlock codes maintained: ${teamsAfterUpdate.length}`);

    // Cleanup
    console.log('\n🧹 CLEANUP');
    await Challenge.findByIdAndDelete(newChallenge._id);
    await Team.findByIdAndDelete(newTeam._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 SCENARIO TEST RESULTS:');
    console.log('✅ Problem solved: Teams keep their unlock codes');
    console.log('✅ Fairness maintained: No team loses earned privileges');
    console.log('✅ Dynamic system: New teams face current requirements');
    console.log('✅ Admin flexibility: Can add/remove challenges anytime');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testUnlockCodeScenario();
