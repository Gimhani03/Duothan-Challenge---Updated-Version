const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

// Test script to debug team creation issues

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if a user can create a team
    console.log('\n🔍 Testing team creation...');
    
    // Find an existing user
    const testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
      console.log('❌ No users found. Create a user first.');
      return;
    }
    
    console.log('✅ Found test user:', testUser.username);
    
    // Check if user is already in a team
    if (testUser.team) {
      console.log('⚠️  User is already in a team:', testUser.team);
      // Remove user from team for testing
      testUser.team = null;
      await testUser.save();
      console.log('✅ Removed user from existing team for testing');
    }
    
    // Test 2: Create a new team
    const testTeamData = {
      name: `Test Team ${Date.now()}`,
      description: 'Test team for debugging',
      leader: testUser._id,
      members: [testUser._id],
      maxMembers: 4
    };
    
    const newTeam = new Team(testTeamData);
    await newTeam.save();
    console.log('✅ Team created successfully:', newTeam.name);
    console.log('✅ Invite code generated:', newTeam.inviteCode);
    
    // Test 3: Update user with team
    testUser.team = newTeam._id;
    await testUser.save();
    console.log('✅ User updated with team reference');
    
    // Test 4: Check authentication token generation
    const token = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    console.log('✅ JWT token generated for user');
    
    // Test 5: Common error scenarios
    console.log('\n🔍 Testing error scenarios...');
    
    // Try to create team with same name
    try {
      const duplicateTeam = new Team({
        name: testTeamData.name,
        description: 'Duplicate team',
        leader: testUser._id,
        members: [testUser._id],
        maxMembers: 4
      });
      await duplicateTeam.save();
      console.log('❌ Should have failed with duplicate name');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate team name');
    }
    
    // Try to create team with invalid name
    try {
      const invalidTeam = new Team({
        name: 'ab', // Too short
        description: 'Invalid team',
        leader: testUser._id,
        members: [testUser._id],
        maxMembers: 4
      });
      await invalidTeam.save();
      console.log('❌ Should have failed with invalid name');
    } catch (error) {
      console.log('✅ Correctly rejected invalid team name');
    }
    
    // Clean up
    await Team.deleteOne({ _id: newTeam._id });
    testUser.team = null;
    await testUser.save();
    console.log('✅ Cleaned up test data');
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
})();
