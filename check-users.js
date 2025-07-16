const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect('mongodb://localhost:27017/duothan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  const allUsers = await User.find({}, 'username email role isActive');
  console.log('All users:');
  allUsers.forEach(user => {
    console.log(`- ${user.username} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
  });
  
  const totalUsers = await User.countDocuments({ isActive: true });
  console.log(`\nTotal active users: ${totalUsers}`);
  
  const nonAdminUsers = await User.countDocuments({ isActive: true, role: { $ne: 'admin' } });
  console.log(`Active non-admin users: ${nonAdminUsers}`);
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
