const express = require('express');
const User = require('../models/User');
const Team = require('../models/Team');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Basic counts - exclude admin users from registered users count
    const totalUsers = await User.countDocuments({ 
      isActive: true, 
      role: { $ne: 'admin' } 
    });
    const totalTeams = await Team.countDocuments({ isActive: true });
    const totalChallenges = await Challenge.countDocuments({ isActive: true });
    
    // Count submissions from registered users only (exclude admin submissions)
    const totalSubmissions = await Submission.aggregate([
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
    
    const submissionCount = totalSubmissions.length > 0 ? totalSubmissions[0].totalSubmissions : 0;

    // Recent activity (excluding admin submissions)
    const recentSubmissions = await Submission.find()
      .populate('team', 'name')
      .populate('challenge', 'title type')
      .populate({
        path: 'submittedBy',
        select: 'username role',
        match: { role: { $ne: 'admin' } }
      })
      .sort({ createdAt: -1 })
      .limit(10);

    // Filter out submissions with null submittedBy (admin submissions)
    const filteredRecentSubmissions = recentSubmissions.filter(sub => sub.submittedBy);

    // Challenge type breakdown
    const challengeBreakdown = await Challenge.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Submission status breakdown (excluding admin submissions)
    const submissionBreakdown = await Submission.aggregate([
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

    // Team size distribution
    const teamSizeDistribution = await Team.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: { $size: '$members' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { '_id': 1 } }
    ]);

    // Most active teams (by submission count, excluding admin submissions)
    const mostActiveTeams = await Submission.aggregate([
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
        $group: { 
          _id: '$team', 
          submissionCount: { $sum: 1 },
          lastSubmission: { $max: '$createdAt' }
        } 
      },
      { $sort: { submissionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: '_id',
          as: 'teamInfo'
        }
      },
      { $unwind: '$teamInfo' }
    ]);

    const responseData = {
      stats: {
        totalUsers,
        totalTeams,
        totalChallenges,
        totalSubmissions: submissionCount
      },
      recentSubmissions: filteredRecentSubmissions,
      breakdowns: {
        challenges: challengeBreakdown,
        submissions: submissionBreakdown,
        teamSizes: teamSizeDistribution
      },
      mostActiveTeams
    };

    console.log('Admin dashboard response:', JSON.stringify(responseData.stats, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with filtering and pagination (excluding admin users)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { role: { $ne: 'admin' } }; // Exclude admin users
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.role && req.query.role !== 'admin') filter.role = req.query.role;
    if (req.query.hasTeam === 'true') filter.team = { $ne: null };
    if (req.query.hasTeam === 'false') filter.team = null;

    const users = await User.find(filter)
      .select('-password')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teams with filtering and pagination
router.get('/teams', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const teams = await Team.find(filter)
      .populate('members', 'username email')
      .populate('leader', 'username email')
      .populate('completedChallenges.challengeId', 'title type points')
      .sort({ points: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Team.countDocuments(filter);

    // Add submission counts
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      const submissionCount = await Submission.countDocuments({ team: team._id });
      return {
        ...team.toObject(),
        submissionCount
      };
    }));

    res.json({
      teams: teamsWithStats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team details with submission history
router.get('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'username email createdAt')
      .populate('leader', 'username email')
      .populate('completedChallenges.challengeId', 'title type points difficulty');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get submission history
    const submissions = await Submission.find({ team: team._id })
      .populate('challenge', 'title type difficulty points')
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      team,
      submissions
    });
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role or status
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate team
router.put('/teams/:id/deactivate', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.isActive = false;
    await team.save();

    // Remove team from all members
    await User.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );

    res.json({ message: 'Team deactivated successfully' });
  } catch (error) {
    console.error('Deactivate team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get competition analytics
router.get('/analytics', async (req, res) => {
  try {
    // Submission trends over time
    const submissionTrends = await Submission.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          accepted: {
            $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } },
      { $limit: 30 }
    ]);

    // Language usage
    const languageUsage = await Submission.aggregate([
      { $match: { language: { $exists: true } } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Challenge difficulty completion rates
    const difficultyStats = await Challenge.aggregate([
      {
        $lookup: {
          from: 'submissions',
          let: { challengeId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$challenge', '$$challengeId'] }, isCorrect: true } },
            { $group: { _id: null, count: { $sum: 1 } } }
          ],
          as: 'completions'
        }
      },
      {
        $group: {
          _id: '$difficulty',
          totalChallenges: { $sum: 1 },
          totalCompletions: { $sum: { $ifNull: [{ $arrayElemAt: ['$completions.count', 0] }, 0] } }
        }
      }
    ]);

    res.json({
      submissionTrends,
      languageUsage,
      difficultyStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset competition (use with caution)
router.post('/reset-competition', async (req, res) => {
  try {
    const { confirmCode } = req.body;
    
    if (confirmCode !== 'RESET_DUOTHAN_2024') {
      return res.status(400).json({ message: 'Invalid confirmation code' });
    }

    // Reset all team points and completed challenges
    await Team.updateMany(
      {},
      { 
        $set: { points: 0, completedChallenges: [] }
      }
    );

    // Delete all submissions
    await Submission.deleteMany({});

    res.json({ message: 'Competition reset successfully' });
  } catch (error) {
    console.error('Reset competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
