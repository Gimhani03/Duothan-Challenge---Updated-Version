const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const Submission = require('./models/Submission');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/duothan')
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    // Test the new buildathon completion system
    console.log('\n🧪 Testing Buildathon Completion System...\n');
    
    // Find the CODEX team (they have unlock code)
    const codexTeam = await Team.findOne({ name: 'CODEX' });
    if (!codexTeam) {
      console.log('❌ CODEX team not found');
      process.exit(1);
    }
    
    console.log('✅ Found CODEX team');
    console.log(`   - Unlock code: ${codexTeam.buildathonUnlockCode}`);
    console.log(`   - Buildathon unlocked: ${codexTeam.buildathonUnlocked}`);
    console.log(`   - Current points: ${codexTeam.points}`);
    
    // Find buildathon challenges
    const buildathonChallenges = await Challenge.find({ type: 'buildathon', isActive: true });
    console.log(`\n🏗️ Found ${buildathonChallenges.length} buildathon challenges`);
    
    if (buildathonChallenges.length === 0) {
      console.log('📝 Creating test buildathon challenge...');
      
      const buildathonChallenge = new Challenge({
        title: '🏗️ E-Commerce Platform',
        description: 'Build a complete e-commerce platform with user authentication, product management, shopping cart, and payment integration.',
        problemStatement: 'Create a full-stack e-commerce application that allows users to browse products, add them to cart, and complete purchases.',
        inputFormat: 'N/A (This is a buildathon challenge)',
        outputFormat: 'GitHub repository link with deployed application',
        constraints: 'Must use modern web technologies (React/Vue/Angular + Node.js/Python/Java)',
        sampleInput: 'N/A',
        sampleOutput: 'GitHub repository with working application',
        type: 'buildathon',
        difficulty: 'hard',
        points: 500,
        testCases: [],
        isActive: true
      });
      
      await buildathonChallenge.save();
      console.log('✅ Created test buildathon challenge');
      buildathonChallenges.push(buildathonChallenge);
    }
    
    const firstBuildathonChallenge = buildathonChallenges[0];
    console.log(`   - Using challenge: ${firstBuildathonChallenge.title}`);
    console.log(`   - Points: ${firstBuildathonChallenge.points}`);
    
    // Find a team member to simulate submission
    const teamMember = await User.findOne({ team: codexTeam._id });
    if (!teamMember) {
      console.log('❌ No team member found');
      process.exit(1);
    }
    
    console.log(`\n👤 Found team member: ${teamMember.username}`);
    
    // Check if they already have a submission
    const existingSubmission = await Submission.findOne({
      team: codexTeam._id,
      challenge: firstBuildathonChallenge._id,
      submissionType: 'github'
    });
    
    if (existingSubmission) {
      console.log('📋 Existing submission found:');
      console.log(`   - GitHub URL: ${existingSubmission.githubUrl}`);
      console.log(`   - Status: ${existingSubmission.status}`);
      console.log(`   - Submitted: ${existingSubmission.createdAt}`);
      
      // Check if challenge is marked as completed
      const challengeCompletion = codexTeam.completedChallenges.find(
        cc => cc.challengeId.toString() === firstBuildathonChallenge._id.toString()
      );
      
      if (challengeCompletion) {
        console.log('✅ Challenge is marked as completed in team record');
        console.log(`   - Points: ${challengeCompletion.points}`);
        console.log(`   - Is correct: ${challengeCompletion.isCorrect}`);
        console.log(`   - Completed at: ${challengeCompletion.completedAt}`);
      } else {
        console.log('❌ Challenge NOT marked as completed in team record');
      }
    } else {
      console.log('📤 Simulating buildathon submission...');
      
      // Create a new submission
      const submission = new Submission({
        team: codexTeam._id,
        challenge: firstBuildathonChallenge._id,
        submittedBy: teamMember._id,
        githubUrl: 'https://github.com/codex-team/ecommerce-platform',
        submissionType: 'github',
        status: 'pending'
      });
      
      await submission.save();
      console.log('✅ Created submission');
      
      // Check if challenge is already completed
      const alreadyCompleted = codexTeam.completedChallenges.some(
        cc => cc.challengeId.toString() === firstBuildathonChallenge._id.toString()
      );
      
      if (!alreadyCompleted) {
        // Mark challenge as completed
        codexTeam.completedChallenges.push({
          challengeId: firstBuildathonChallenge._id,
          completedAt: new Date(),
          points: firstBuildathonChallenge.points,
          isCorrect: true,
          pointsAwarded: true
        });
        codexTeam.points += firstBuildathonChallenge.points;
        await codexTeam.save();
        
        console.log('✅ Challenge marked as completed');
        console.log(`   - Points awarded: ${firstBuildathonChallenge.points}`);
        console.log(`   - New total points: ${codexTeam.points}`);
      } else {
        console.log('ℹ️  Challenge already completed');
      }
    }
    
    // Final status
    const updatedTeam = await Team.findById(codexTeam._id);
    console.log(`\n📊 Final Team Status:`);
    console.log(`   - Total points: ${updatedTeam.points}`);
    console.log(`   - Completed challenges: ${updatedTeam.completedChallenges.length}`);
    console.log(`   - Buildathon challenges completed: ${updatedTeam.completedChallenges.filter(cc => cc.isCorrect).length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
