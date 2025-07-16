const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get teams sorted by points and last submission time
    const teams = await Team.find({ isActive: true })
      .populate('members', 'username')
      .populate('leader', 'username')
      .populate('completedChallenges.challengeId', 'title points')
      .sort({ 
        points: -1, 
        'completedChallenges.completedAt': 1 // Earlier completion time for tiebreaker
      })
      .skip(skip)
      .limit(limit);

    // Add rank and additional stats
    const leaderboard = teams.map((team, index) => {
      const rank = skip + index + 1;
      const algorithmicChallenges = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'algorithmic'
      ).length;
      const buildathonChallenges = team.completedChallenges.filter(
        cc => cc.challengeId && cc.challengeId.type === 'buildathon'
      ).length;

      return {
        rank,
        team: {
          id: team._id,
          name: team.name,
          members: team.members,
          leader: team.leader,
          points: team.points,
          totalChallenges: team.completedChallenges.length,
          algorithmicChallenges,
          buildathonChallenges,
          lastSubmissionTime: team.completedChallenges.length > 0 
            ? Math.max(...team.completedChallenges.map(cc => new Date(cc.completedAt).getTime()))
            : null
        }
      };
    });

    const total = await Team.countDocuments({ isActive: true });

    res.json({
      leaderboard,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team's rank and nearby teams
router.get('/my-team', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to view ranking' });
    }

    // Get all teams sorted by points
    const allTeams = await Team.find({ isActive: true })
      .select('_id name points completedChallenges')
      .sort({ 
        points: -1, 
        'completedChallenges.completedAt': 1 
      });

    // Find team's rank
    const teamIndex = allTeams.findIndex(team => team._id.toString() === user.team.toString());
    const teamRank = teamIndex + 1;

    // Get teams around current team (5 above and 5 below)
    const start = Math.max(0, teamIndex - 5);
    const end = Math.min(allTeams.length, teamIndex + 6);
    const nearbyTeams = allTeams.slice(start, end);

    // Populate detailed info for nearby teams
    const populatedNearbyTeams = await Team.populate(nearbyTeams, [
      { path: 'members', select: 'username' },
      { path: 'leader', select: 'username' }
    ]);

    const leaderboard = populatedNearbyTeams.map((team, index) => {
      const rank = start + index + 1;
      return {
        rank,
        team: {
          id: team._id,
          name: team.name,
          members: team.members,
          leader: team.leader,
          points: team.points,
          totalChallenges: team.completedChallenges.length,
          isCurrentTeam: team._id.toString() === user.team.toString()
        }
      };
    });

    res.json({
      myTeamRank: teamRank,
      totalTeams: allTeams.length,
      leaderboard
    });
  } catch (error) {
    console.error('Get team rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments({ isActive: true });
    const totalSubmissions = await Submission.countDocuments();
    const acceptedSubmissions = await Submission.countDocuments({ isCorrect: true });
    
    // Get top performers
    const topTeams = await Team.find({ isActive: true })
      .select('name points completedChallenges')
      .sort({ points: -1 })
      .limit(3);

    // Challenge completion stats
    const challengeStats = await Team.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$completedChallenges' },
      { 
        $group: {
          _id: '$completedChallenges.challengeId',
          completionCount: { $sum: 1 }
        }
      },
      { $sort: { completionCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalTeams,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate: totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions * 100).toFixed(2) : 0,
      topTeams,
      challengeStats
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
