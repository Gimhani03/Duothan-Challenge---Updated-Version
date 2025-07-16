const express = require('express');
const { body, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all challenges for participants
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to view challenges' });
    }

    const team = await Team.findById(user.team).populate('completedChallenges.challengeId');
    const completedChallengeIds = team.completedChallenges.map(cc => cc.challengeId._id.toString());

    // Get all active challenges separated by type
    const allChallenges = await Challenge.find({ isActive: true }).sort({ type: 1, createdAt: 1 });
    const algorithmicChallenges = allChallenges.filter(c => c.type === 'algorithmic');
    const buildathonChallenges = allChallenges.filter(c => c.type === 'buildathon');

    // Check if all algorithmic challenges are completed
    const completedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;
    const allAlgorithmicCompleted = algorithmicChallenges.length > 0 && 
                                   completedAlgorithmicCount === algorithmicChallenges.length;

    // Add completion status to algorithmic challenges
    const algorithmicWithStatus = algorithmicChallenges.map(challenge => ({
      ...challenge.toObject(),
      isCompleted: completedChallengeIds.includes(challenge._id.toString()),
      testCases: challenge.testCases?.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
      })) || []
    }));

    // Add completion status to buildathon challenges
    const buildathonWithStatus = buildathonChallenges.map(challenge => ({
      ...challenge.toObject(),
      isCompleted: completedChallengeIds.includes(challenge._id.toString()),
      isLocked: !team.buildathonUnlocked,
      testCases: challenge.testCases?.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
      })) || []
    }));

    res.json({
      success: true,
      algorithmic: algorithmicWithStatus,
      buildathon: buildathonWithStatus,
      allAlgorithmicCompleted,
      buildathonUnlocked: team.buildathonUnlocked,
      completedCount: {
        algorithmic: completedAlgorithmicCount,
        total: algorithmicChallenges.length
      }
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific challenge
router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user's team has access to this challenge
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to view challenges' });
    }

    const team = await Team.findById(user.team).populate('completedChallenges.challengeId');
    const completedChallengeIds = team.completedChallenges.map(cc => cc.challengeId._id.toString());

    // Check unlock conditions
    if (challenge.unlockConditions && challenge.unlockConditions.length > 0) {
      const hasAccess = challenge.unlockConditions.every(conditionId => 
        completedChallengeIds.includes(conditionId.toString())
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'This challenge is locked' });
      }
    }

    // Hide expected output for hidden test cases
    const challengeData = {
      ...challenge.toObject(),
      testCases: challenge.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
      })),
      isCompleted: completedChallengeIds.includes(challenge._id.toString())
    };

    res.json({ challenge: challengeData });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create challenge
router.post('/admin/create', auth, adminAuth, [
  body('title').notEmpty().trim(),
  body('description').notEmpty(),
  body('problemStatement').notEmpty(),
  body('inputFormat').notEmpty(),
  body('outputFormat').notEmpty(), 
  body('constraints').notEmpty(),
  body('sampleInput').notEmpty(),
  body('sampleOutput').notEmpty(),
  body('type').isIn(['algorithmic', 'buildathon']),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('points').isNumeric().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const challenge = new Challenge(req.body);
    await challenge.save();

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
});

// Admin: Update challenge
router.put('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    Object.assign(challenge, req.body);
    await challenge.save();

    res.json({
      message: 'Challenge updated successfully',
      challenge
    });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete challenge
router.delete('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    challenge.isActive = false;
    await challenge.save();

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all challenges
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({ order: 1, createdAt: 1 });
    res.json({ challenges });
  } catch (error) {
    console.error('Get all challenges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlock buildathon challenges with code
router.post('/unlock-buildathon', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unlockCode } = req.body;
    
    if (!unlockCode) {
      return res.status(400).json({ message: 'Unlock code is required' });
    }

    const user = await User.findById(userId);
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to unlock buildathon challenges' });
    }

    const team = await Team.findById(user.team).populate('completedChallenges.challengeId');
    
    // Check if team already has buildathon unlocked
    if (team.buildathonUnlocked) {
      return res.status(400).json({ message: 'Buildathon challenges are already unlocked for your team' });
    }

    // Check if all algorithmic challenges are completed
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const completedChallengeIds = team.completedChallenges.map(cc => cc.challengeId._id.toString());
    const completedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;

    if (algorithmicChallenges.length === 0 || completedAlgorithmicCount !== algorithmicChallenges.length) {
      return res.status(400).json({ 
        message: 'You must complete all algorithmic challenges before unlocking buildathon challenges',
        progress: `${completedAlgorithmicCount}/${algorithmicChallenges.length} algorithmic challenges completed`
      });
    }

    // Verify the unlock code (you can make this more sophisticated)
    const expectedCode = team.buildathonUnlockCode;
    if (!expectedCode || unlockCode !== expectedCode) {
      return res.status(400).json({ message: 'Invalid unlock code' });
    }

    // Unlock buildathon challenges
    team.buildathonUnlocked = true;
    team.buildathonUnlockedAt = new Date();
    await team.save();

    res.json({
      success: true,
      message: 'Buildathon challenges unlocked successfully!',
      unlockedAt: team.buildathonUnlockedAt
    });
  } catch (error) {
    console.error('Error unlocking buildathon:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate buildathon unlock code when all algorithmic challenges are completed
router.post('/generate-unlock-code', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team' });
    }

    const team = await Team.findById(user.team).populate('completedChallenges.challengeId');
    
    // Check if all algorithmic challenges are completed
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const completedChallengeIds = team.completedChallenges.map(cc => cc.challengeId._id.toString());
    const completedAlgorithmicCount = algorithmicChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;

    if (algorithmicChallenges.length === 0 || completedAlgorithmicCount !== algorithmicChallenges.length) {
      return res.status(400).json({ 
        message: 'Complete all algorithmic challenges first',
        progress: `${completedAlgorithmicCount}/${algorithmicChallenges.length} completed`
      });
    }

    // Generate unique unlock code if not already generated
    if (!team.buildathonUnlockCode) {
      const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
      team.buildathonUnlockCode = unlockCode;
      await team.save();
    }

    res.json({
      success: true,
      unlockCode: team.buildathonUnlockCode,
      message: 'Congratulations! You have completed all algorithmic challenges. Use this code to unlock buildathon challenges.'
    });
  } catch (error) {
    console.error('Error generating unlock code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
