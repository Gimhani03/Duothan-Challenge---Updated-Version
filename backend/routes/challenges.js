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
    const completedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    // Get correctly solved challenges (for buildathon unlock logic)
    const correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());

    // Get all active challenges separated by type
    const allChallenges = await Challenge.find({ isActive: true }).sort({ type: 1, createdAt: 1 });
    const algorithmicChallenges = allChallenges.filter(c => c.type === 'algorithmic');
    const buildathonChallenges = allChallenges.filter(c => c.type === 'buildathon');

    // Get team's required challenges for versioned requirements
    let requiredChallenges = [];
    if (team.requiredChallenges && team.requiredChallenges.length > 0) {
      // Use versioned requirements
      const requiredIds = team.requiredChallenges.map(rc => rc.challengeId.toString());
      requiredChallenges = algorithmicChallenges.filter(c => requiredIds.includes(c._id.toString()));
    } else {
      // Fallback to all current algorithmic challenges
      requiredChallenges = algorithmicChallenges;
    }

    // Check if all required challenges are completed (for buildathon unlock)
    const completedAlgorithmicCount = requiredChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    const correctlySolvedAlgorithmicCount = requiredChallenges.filter(challenge => 
      correctlySolvedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    // Use completion (not correctness) for buildathon unlock
    const allAlgorithmicCompleted = requiredChallenges.length > 0 && 
                                   completedAlgorithmicCount === requiredChallenges.length;

    // Add completion status to algorithmic challenges
    const algorithmicWithStatus = algorithmicChallenges.map(challenge => {
      const isCompleted = completedChallengeIds.includes(challenge._id.toString());
      const isCorrect = correctlySolvedChallengeIds.includes(challenge._id.toString());
      
      return {
        ...challenge.toObject(),
        isCompleted: isCompleted,
        isCorrect: isCorrect,
        status: isCorrect ? 'solved' : (isCompleted ? 'attempted' : 'not_attempted'),
        testCases: challenge.testCases?.map(tc => ({
          ...tc,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
        })) || []
      };
    });

    // Add completion status to buildathon challenges
    const buildathonWithStatus = buildathonChallenges.map(challenge => {
      const isCompleted = completedChallengeIds.includes(challenge._id.toString());
      const isCorrect = correctlySolvedChallengeIds.includes(challenge._id.toString());
      
      return {
        ...challenge.toObject(),
        isCompleted: isCompleted,
        isCorrect: isCorrect,
        status: isCorrect ? 'solved' : (isCompleted ? 'attempted' : 'not_attempted'),
        isLocked: !team.buildathonUnlocked,
        testCases: challenge.testCases?.map(tc => ({
          ...tc,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
        })) || []
      };
    });

    res.json({
      success: true,
      algorithmic: algorithmicWithStatus,
      buildathon: buildathonWithStatus,
      allAlgorithmicCompleted,
      buildathonUnlocked: team.buildathonUnlocked,
      unlockCode: allAlgorithmicCompleted ? team.buildathonUnlockCode : null,
      completedCount: {
        algorithmic: completedAlgorithmicCount,
        algorithmicCorrect: correctlySolvedAlgorithmicCount,
        total: algorithmicChallenges.length,
        required: requiredChallenges.length,
        requiredCorrect: correctlySolvedAlgorithmicCount
      },
      teamStats: {
        totalPoints: team.points,
        totalAttempted: completedChallengeIds.length,
        totalSolved: correctlySolvedChallengeIds.length
      },
      versioning: {
        hasVersionedRequirements: team.requiredChallenges && team.requiredChallenges.length > 0,
        requiredChallenges: team.requiredChallenges || [],
        requiredCount: requiredChallenges.length,
        totalAvailable: algorithmicChallenges.length
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
    const completedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    const correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());

    // Check unlock conditions
    if (challenge.unlockConditions && challenge.unlockConditions.length > 0) {
      const hasAccess = challenge.unlockConditions.every(conditionId => 
        correctlySolvedChallengeIds.includes(conditionId.toString())
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'This challenge is locked. You need to correctly solve the prerequisite challenges first.' });
      }
    }

    // Hide expected output for hidden test cases
    const isCompleted = completedChallengeIds.includes(challenge._id.toString());
    const isCorrect = correctlySolvedChallengeIds.includes(challenge._id.toString());
    
    const challengeData = {
      ...challenge.toObject(),
      testCases: challenge.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
      })),
      isCompleted: isCompleted,
      isCorrect: isCorrect,
      status: isCorrect ? 'solved' : (isCompleted ? 'attempted' : 'not_attempted')
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

    // If this is an algorithmic challenge being created, 
    // it only affects NEW teams (preserving versioned requirements)
    if (challenge.type === 'algorithmic') {
      console.log(`📝 New algorithmic challenge created: ${challenge.title}`);
      console.log(`   - Only NEW teams will need to complete this challenge for unlock codes`);
      console.log(`   - Existing teams maintain their original requirements`);
      
      // No need to affect existing teams - they keep their versioned requirements
      // Only new teams will get this challenge in their requirements
    }

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

    const wasAlgorithmic = challenge.type === 'algorithmic';
    const wasActive = challenge.isActive;
    
    Object.assign(challenge, req.body);
    await challenge.save();

    // If this was an algorithmic challenge and its active status changed,
    // check if any teams now qualify for unlock codes
    if (wasAlgorithmic && (wasActive !== challenge.isActive)) {
      await checkAndGenerateUnlockCodes();
    }

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

    const wasAlgorithmic = challenge.type === 'algorithmic';
    
    challenge.isActive = false;
    await challenge.save();

    // If this was an algorithmic challenge, check if any teams now qualify for unlock codes
    if (wasAlgorithmic) {
      await checkAndGenerateUnlockCodes();
    }

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check all teams and generate unlock codes if needed
async function checkAndGenerateUnlockCodes() {
  try {
    const codesGenerated = await Team.checkAllTeamsForUnlockCodes();
    console.log(`� Admin action triggered unlock code check - Generated ${codesGenerated} new codes`);
  } catch (error) {
    console.error('Error checking unlock codes after admin action:', error);
  }
}

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

    // Check if all algorithmic challenges are completed (not necessarily correct)
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    const completedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    const correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());
    
    // Use completion count for unlock eligibility
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
    
    // Check if all required challenges are completed (using versioning)
    let requiredChallenges = [];
    if (team.requiredChallenges && team.requiredChallenges.length > 0) {
      // Use versioned requirements
      const requiredIds = team.requiredChallenges.map(rc => rc.challengeId);
      requiredChallenges = await Challenge.find({ 
        _id: { $in: requiredIds }, 
        type: 'algorithmic', 
        isActive: true 
      });
    } else {
      // Fallback to all current algorithmic challenges
      requiredChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    }
    
    const completedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id.toString());
    
    const correctlySolvedChallengeIds = team.completedChallenges
      .filter(cc => cc.challengeId !== null && cc.isCorrect === true)
      .map(cc => cc.challengeId._id.toString());
    
    // Use completion count for unlock eligibility
    const completedRequiredCount = requiredChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;

    if (requiredChallenges.length === 0 || completedRequiredCount !== requiredChallenges.length) {
      return res.status(400).json({ 
        message: 'Complete all required algorithmic challenges first',
        progress: `${completedRequiredCount}/${requiredChallenges.length} required challenges completed`,
        versioning: {
          hasVersionedRequirements: team.requiredChallenges && team.requiredChallenges.length > 0,
          requiredCount: requiredChallenges.length
        }
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
      message: 'Congratulations! You have correctly solved all algorithmic challenges. Use this code to unlock buildathon challenges.'
    });
  } catch (error) {
    console.error('Error generating unlock code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
