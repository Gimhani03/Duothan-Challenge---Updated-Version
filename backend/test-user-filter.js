const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/duothan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Test the filter logic for user management
  const filter = { role: { $ne: 'admin' } };
  const nonAdminUsers = await User.find(filter, 'username email role isActive team');
  console.log('Non-admin users (for user management):');
  nonAdminUsers.forEach(user => {
    console.log(`- ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
  });
  
  const nonAdminCount = await User.countDocuments(filter);
  console.log(`\nTotal non-admin users: ${nonAdminCount}`);
  
  // Also check the registered users count (active non-admin users)
  const registeredUsersCount = await User.countDocuments({ isActive: true, role: { $ne: 'admin' } });
  console.log(`Active registered users (for dashboard stats): ${registeredUsersCount}`);
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
