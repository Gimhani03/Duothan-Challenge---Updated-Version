const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/duothan');
    console.log('Connected to MongoDB');
    
    // Check existing teams
    const existingTeams = await Team.find();
    console.log('Existing teams:', existingTeams.length);
    
    // Check existing users
    const existingUsers = await User.find();
    console.log('Existing users:', existingUsers.length);
    
    // Show teams with potential issues
    const teamsWithIssues = await Team.find({ inviteCode: { $exists: false } });
    console.log('Teams without invite codes:', teamsWithIssues.length);
    
    // Show duplicate team names
    const duplicateNames = await Team.aggregate([
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    console.log('Duplicate team names:', duplicateNames);
    
    // Clean up test data
    await Team.deleteMany({ name: /Test Team|API Test Team/ });
    console.log('Cleaned up test teams');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
})();
