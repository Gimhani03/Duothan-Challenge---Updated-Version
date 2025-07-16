const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Submission = require('./models/Submission');

mongoose.connect('mongodb://localhost:27017/duothan');

async function checkSubmissions() {
  try {
    const totalSubmissions = await Submission.countDocuments();
    console.log('Total submissions (all):', totalSubmissions);
    
    const submissionsFromUsers = await Submission.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          'user.role': { $ne: 'admin' }
        }
      },
      {
        $count: 'totalSubmissions'
      }
    ]);
    
    const userSubmissionCount = submissionsFromUsers.length > 0 ? submissionsFromUsers[0].totalSubmissions : 0;
    console.log('Submissions from registered users only:', userSubmissionCount);
    
    const submissionsByStatus = await Submission.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          'user.role': { $ne: 'admin' }
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('Submission breakdown by status:');
    submissionsByStatus.forEach(s => {
      console.log(`  ${s._id || 'Unknown'}: ${s.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkSubmissions();
