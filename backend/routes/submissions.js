const express = require('express');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');
const judge0Service = require('../services/judge0Service');
const mockJudge0Service = require('../services/mockJudge0Service');

const router = express.Router();

// Helper function to get the appropriate Judge0 service
function getJudge0Service() {
  if (process.env.USE_MOCK_JUDGE0 === 'true') {
    console.log('Using Mock Judge0 Service for development');
    return mockJudge0Service;
  }
  return judge0Service;
}

// Submit code for algorithmic challenge
router.post('/code', auth, [
  body('challengeId').isMongoId(),
  body('code').notEmpty(),
  body('language').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { challengeId, code, language } = req.body;
    const userId = req.user.userId;

    // Get user and team
    const user = await User.findById(userId);
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to submit' });
    }

    // Get challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.type !== 'algorithmic') {
      return res.status(400).json({ message: 'This endpoint is for algorithmic challenges only' });
    }

    // Check if team already completed this challenge
    const team = await Team.findById(user.team);
    const alreadyCompleted = team.completedChallenges.some(
      cc => cc.challengeId.toString() === challengeId
    );

    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Your team has already completed this challenge' });
    }

    // Get language ID for Judge0
    const judgeService = getJudge0Service();
    const languageId = judgeService.getLanguageId(language);

    // Create submission
    const submission = new Submission({
      team: user.team,
      challenge: challengeId,
      submittedBy: userId,
      code,
      language,
      languageId,
      submissionType: 'code'
    });

    await submission.save();

    // Execute code with test cases
    try {
      const testCaseResults = await judgeService.executeWithTestCases(
        code,
        languageId,
        challenge.testCases
      );

      // Debug: Log test case results
      console.log('Test case results:', testCaseResults.map(r => ({
        index: r.testCaseIndex,
        status: r.status,
        isCorrect: r.isCorrect,
        actualOutput: JSON.stringify(r.output),
        expectedOutput: JSON.stringify(r.expectedOutput)
      })));

      // Update submission with results
      submission.testCaseResults = testCaseResults;
      
      // Check if all test cases passed
      const allPassed = testCaseResults.every(result => result.isCorrect);
      
      // Check if challenge is already completed by this team
      const alreadyCompleted = team.completedChallenges.some(
        cc => cc.challengeId.toString() === challengeId
      );
      
      if (allPassed) {
        submission.status = 'accepted';
        submission.isCorrect = true;
        submission.points = challenge.points;
        
        // Update team's completed challenges and points
        if (!alreadyCompleted) {
          team.completedChallenges.push({
            challengeId: challengeId,
            completedAt: new Date(),
            points: challenge.points,
            isCorrect: true,
            pointsAwarded: true
          });
          team.points += challenge.points;
        } else {
          // Update existing completion record if it was previously incorrect
          const existingCompletion = team.completedChallenges.find(
            cc => cc.challengeId.toString() === challengeId
          );
          if (existingCompletion && !existingCompletion.isCorrect) {
            existingCompletion.isCorrect = true;
            existingCompletion.points = challenge.points;
            existingCompletion.completedAt = new Date();
            existingCompletion.pointsAwarded = true;
            team.points += challenge.points;
          }
        }
        await team.save();
        
        // Check if all algorithmic challenges are now completed correctly
        if (challenge.type === 'algorithmic') {
          // Use the new team method to check and generate unlock code
          await team.checkAndGenerateUnlockCode();
        }
      } else {
        // Determine overall status based on test case results
        const hasCompilationError = testCaseResults.some(r => r.status === 'Compilation Error');
        const hasRuntimeError = testCaseResults.some(r => r.status.includes('Runtime Error'));
        const hasTimeLimit = testCaseResults.some(r => r.status === 'Time Limit Exceeded');
        
        if (hasCompilationError) {
          submission.status = 'compilation_error';
        } else if (hasRuntimeError) {
          submission.status = 'runtime_error';
        } else if (hasTimeLimit) {
          submission.status = 'time_limit_exceeded';
        } else {
          submission.status = 'wrong_answer';
        }
        
        // Mark challenge as completed (attempted) even if wrong answer
        // But don't award points for incorrect solutions
        if (!alreadyCompleted) {
          team.completedChallenges.push({
            challengeId: challengeId,
            completedAt: new Date(),
            points: 0, // No points for wrong answers
            isCorrect: false,
            pointsAwarded: false // No points awarded for incorrect solutions
          });
          await team.save();
        }
      }

      await submission.save();

      // Return submission with test case results (hide expected output for hidden test cases)
      const responseData = {
        ...submission.toObject(),
        testCaseResults: testCaseResults.map((result, index) => ({
          ...result,
          expectedOutput: challenge.testCases[index].isHidden ? '[Hidden]' : result.expectedOutput
        })),
        judge0Info: {
          apiUrl: process.env.JUDGE0_API_URL,
          languageId: languageId,
          uploadedAt: new Date().toISOString(),
          totalTestCases: challenge.testCases.length,
          passedTestCases: testCaseResults.filter(r => r.isCorrect).length
        }
      };

      // Check if unlock code was just generated
      const updatedTeam = await Team.findById(team._id);
      const unlockCodeGenerated = updatedTeam.buildathonUnlockCode && !team.buildathonUnlockCode;
      
      res.json({
        message: allPassed ? 'All test cases passed!' : 'Some test cases failed',
        submission: responseData,
        unlockCode: unlockCodeGenerated ? {
          generated: true,
          code: updatedTeam.buildathonUnlockCode,
          message: '🎉 Congratulations! You have completed all algorithmic challenges. Use this code to unlock buildathon challenges.'
        } : null
      });

    } catch (judgeError) {
      console.error('Judge0 execution error:', judgeError);
      submission.status = 'runtime_error';
      submission.error = judgeError.message;
      await submission.save();

      res.status(500).json({
        message: 'Code execution failed',
        error: judgeError.message
      });
    }

  } catch (error) {
    console.error('Code submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit GitHub link for buildathon challenge
router.post('/github', auth, [
  body('challengeId').isMongoId(),
  body('githubUrl').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { challengeId, githubUrl } = req.body;
    const userId = req.user.userId;

    // Get user and team
    const user = await User.findById(userId);
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to submit' });
    }

    // Get challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.type !== 'buildathon') {
      return res.status(400).json({ message: 'This endpoint is for buildathon challenges only' });
    }

    // Validate GitHub URL
    if (!githubUrl.includes('github.com')) {
      return res.status(400).json({ message: 'Please provide a valid GitHub URL' });
    }

    // Get team
    const team = await Team.findById(user.team);
    
    // Check if team already submitted for this challenge
    const existingSubmission = await Submission.findOne({
      team: user.team,
      challenge: challengeId,
      submissionType: 'github'
    });

    // Check if challenge is already completed
    const alreadyCompleted = team.completedChallenges.some(
      cc => cc.challengeId.toString() === challengeId
    );

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.githubUrl = githubUrl;
      existingSubmission.submittedBy = userId;
      existingSubmission.status = 'pending';
      await existingSubmission.save();

      res.json({
        message: 'GitHub submission updated successfully',
        submission: existingSubmission
      });
    } else {
      // Create new submission
      const submission = new Submission({
        team: user.team,
        challenge: challengeId,
        submittedBy: userId,
        githubUrl,
        submissionType: 'github',
        status: 'pending'
      });

      await submission.save();

      // Mark challenge as completed (attempted) when buildathon submission is made
      if (!alreadyCompleted) {
        team.completedChallenges.push({
          challengeId: challengeId,
          completedAt: new Date(),
          points: challenge.points, // Award points for buildathon submissions
          isCorrect: true, // Mark buildathon submissions as correct since they're manual review
          pointsAwarded: true // Mark that points have been awarded
        });
        team.points += challenge.points;
        await team.save();
        
        console.log(`🏗️ Buildathon challenge completed by team ${team.name}: ${challenge.title}`);
        console.log(`   - Points awarded: ${challenge.points}`);
      }

      res.json({
        message: 'GitHub submission created successfully',
        submission,
        pointsAwarded: !alreadyCompleted ? challenge.points : 0
      });
    }

  } catch (error) {
    console.error('GitHub submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team's submissions
router.get('/my-submissions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user.team) {
      return res.status(400).json({ message: 'You must be in a team to view submissions' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ team: user.team })
      .populate('challenge', 'title type difficulty points')
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments({ team: user.team });

    res.json({
      submissions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific submission
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('challenge')
      .populate('submittedBy', 'username')
      .populate('team', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has access to this submission
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (req.user.role !== 'admin' && submission.team._id.toString() !== user.team?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all submissions
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.submissionType = req.query.type;

    const submissions = await Submission.find(filter)
      .populate('challenge', 'title type difficulty points')
      .populate('submittedBy', 'username')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments(filter);

    res.json({
      submissions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update submission status (for buildathon submissions)
router.put('/admin/:id/status', auth, [
  body('status').isIn(['pending', 'accepted', 'rejected']),
  body('points').optional().isNumeric()
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, points } = req.body;
    
    const submission = await Submission.findById(req.params.id)
      .populate('challenge')
      .populate('team');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const oldStatus = submission.status;
    submission.status = status;

    if (status === 'accepted' && oldStatus !== 'accepted') {
      const awardedPoints = points || submission.challenge.points;
      submission.points = awardedPoints;
      submission.isCorrect = true;

      // Update team's completed challenges and points
      const team = submission.team;
      const alreadyCompleted = team.completedChallenges.some(
        cc => cc.challengeId.toString() === submission.challenge._id.toString()
      );

      if (!alreadyCompleted) {
        team.completedChallenges.push({
          challengeId: submission.challenge._id,
          completedAt: new Date(),
          points: awardedPoints
        });
        team.points += awardedPoints;
        await team.save();
      }
    } else if (oldStatus === 'accepted' && status !== 'accepted') {
      // Remove points if previously accepted submission is now rejected
      submission.points = 0;
      submission.isCorrect = false;

      const team = submission.team;
      const completedIndex = team.completedChallenges.findIndex(
        cc => cc.challengeId.toString() === submission.challenge._id.toString()
      );

      if (completedIndex !== -1) {
        const removedPoints = team.completedChallenges[completedIndex].points;
        team.completedChallenges.splice(completedIndex, 1);
        team.points -= removedPoints;
        await team.save();
      }
    }

    await submission.save();

    res.json({
      message: 'Submission status updated successfully',
      submission
    });
  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run code for testing (no submission, just execution)
router.post('/run', auth, [
  body('code').notEmpty(),
  body('language').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, language, input = '' } = req.body;
    const userId = req.user.userId;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get language ID for Judge0
    const judgeService = getJudge0Service();
    const languageId = judgeService.getLanguageId(language);

    try {
      // Submit code to Judge0 for execution
      const submissionResponse = await judgeService.submitCode(
        code,
        languageId,
        input
      );

      // Wait for result
      const result = await judgeService.waitForResult(submissionResponse.token);

      // Prepare response
      const executionResult = {
        status: result.status?.description || 'Unknown',
        statusId: result.status?.id || 0,
        output: result.stdout || '',
        error: result.stderr || '',
        compileOutput: result.compile_output || '',
        time: result.time || '0',
        memory: result.memory || 0,
        exitCode: result.exit_code || 0
      };

      res.json({
        success: true,
        result: executionResult,
        message: 'Code executed successfully'
      });

    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to execute code', 
        error: error.message 
      });
    }

  } catch (error) {
    console.error('Run endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update buildathon submission status
router.put('/admin/buildathon/:submissionId', auth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, feedback, pointsAwarded } = req.body;
    
    // Check if user is admin (you might want to add adminAuth middleware)
    // For now, we'll just check if the user has admin role
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const submission = await Submission.findById(submissionId)
      .populate('challenge')
      .populate('team');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.submissionType !== 'github') {
      return res.status(400).json({ message: 'This endpoint is for buildathon submissions only' });
    }

    // Update submission status
    submission.status = status;
    if (feedback) submission.feedback = feedback;
    await submission.save();

    const team = submission.team;
    const challenge = submission.challenge;
    
    // Find existing completion record
    const existingCompletion = team.completedChallenges.find(
      cc => cc.challengeId.toString() === challenge._id.toString()
    );

    if (existingCompletion) {
      // Update existing completion record
      if (status === 'accepted') {
        existingCompletion.isCorrect = true;
        existingCompletion.points = pointsAwarded || challenge.points;
        
        // Add points if not already awarded
        if (!existingCompletion.pointsAwarded) {
          team.points += existingCompletion.points;
          existingCompletion.pointsAwarded = true;
        }
      } else if (status === 'rejected') {
        existingCompletion.isCorrect = false;
        
        // Remove points if they were previously awarded
        if (existingCompletion.pointsAwarded) {
          team.points -= existingCompletion.points;
          existingCompletion.pointsAwarded = false;
        }
        existingCompletion.points = 0;
      }
      
      await team.save();
    }

    console.log(`🏗️ Admin updated buildathon submission: ${submission._id}`);
    console.log(`   - Team: ${team.name}`);
    console.log(`   - Challenge: ${challenge.title}`);
    console.log(`   - Status: ${status}`);
    console.log(`   - Points: ${pointsAwarded || challenge.points}`);

    res.json({
      message: 'Buildathon submission updated successfully',
      submission: {
        ...submission.toObject(),
        status,
        feedback
      }
    });

  } catch (error) {
    console.error('Admin update buildathon submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all buildathon submissions
router.get('/admin/buildathon', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    const query = { submissionType: 'github' };
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query)
      .populate('challenge', 'title type difficulty points')
      .populate('team', 'name')
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Admin get buildathon submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
