const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create team
router.post('/create', auth, [
  body('name').isLength({ min: 3, max: 50 }).trim(),
  body('description').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    console.log('Team creation request:', {
      userId: req.user?.userId,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { name, description, maxMembers } = req.body;
    const userId = req.user.userId;

    // Check if user is already in a team
    const user = await User.findById(userId);
    if (user.team) {
      return res.status(400).json({ message: 'You are already in a team' });
    }

    // Check if team name exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already exists' });
    }

    // Create team
    const team = new Team({
      name,
      description,
      leader: userId,
      members: [userId],
      maxMembers: maxMembers || 4
    });

    await team.save();

    // Check if the new team qualifies for unlock code
    await team.checkAndGenerateUnlockCode();

    // Update user's team
    user.team = team._id;
    await user.save();

    await team.populate('members', 'username email');
    await team.populate('leader', 'username email');

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.name) {
        return res.status(400).json({ message: 'Team name already exists' });
      }
      if (error.keyPattern?.inviteCode) {
        return res.status(400).json({ message: 'Invite code collision. Please try again.' });
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during team creation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Join team
router.post('/join', auth, [
  body('inviteCode').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inviteCode } = req.body;
    const userId = req.user.userId;

    // Check if user is already in a team
    const user = await User.findById(userId);
    if (user.team) {
      return res.status(400).json({ message: 'You are already in a team' });
    }

    // Find team by invite code
    const team = await Team.findOne({ inviteCode, isActive: true });
    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Add user to team
    team.members.push(userId);
    await team.save();

    // Check if the team qualifies for unlock code (team composition might have changed)
    await team.checkAndGenerateUnlockCode();

    // Update user's team
    user.team = team._id;
    await user.save();

    await team.populate('members', 'username email');
    await team.populate('leader', 'username email');

    res.json({
      message: 'Joined team successfully',
      team
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team details
router.get('/my-team', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user.team) {
      return res.status(404).json({ message: 'You are not in a team' });
    }

    const team = await Team.findById(user.team)
      .populate('members', 'username email')
      .populate('leader', 'username email')
      .populate('completedChallenges.challengeId', 'title points');

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave team
router.post('/leave', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user.team) {
      return res.status(400).json({ message: 'You are not in a team' });
    }

    const team = await Team.findById(user.team);
    
    // Check if user is the leader
    if (team.leader.toString() === userId) {
      // If leader is leaving and there are other members, transfer leadership
      if (team.members.length > 1) {
        const nextLeader = team.members.find(memberId => memberId.toString() !== userId);
        team.leader = nextLeader;
      } else {
        // If leader is the only member, delete the team
        await Team.findByIdAndDelete(team._id);
        user.team = null;
        await user.save();
        return res.json({ message: 'Team deleted as you were the only member' });
      }
    }

    // Remove user from team
    team.members = team.members.filter(memberId => memberId.toString() !== userId);
    await team.save();

    // Update user
    user.team = null;
    await user.save();

    res.json({ message: 'Left team successfully' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teams (for admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const teams = await Team.find({ isActive: true })
      .populate('members', 'username email')
      .populate('leader', 'username email')
      .skip(skip)
      .limit(limit)
      .sort({ points: -1, createdAt: -1 });

    const total = await Team.countDocuments({ isActive: true });

    res.json({
      teams,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
