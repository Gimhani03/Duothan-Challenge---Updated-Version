const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const Submission = require('./models/Submission');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/duothan')
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    // Check if there are any buildathon challenges
    const buildathonChallenges = await Challenge.find({ type: 'buildathon', isActive: true });
    console.log('🏗️ Active buildathon challenges:', buildathonChallenges.length);
    
    if (buildathonChallenges.length === 0) {
      console.log('📝 Creating a sample buildathon challenge for testing...');
      
      const buildathonChallenge = new Challenge({
        title: '🏗️ Build a Task Manager App',
        description: 'Create a full-stack task management application',
        problemStatement: 'Build a comprehensive task management application with user authentication, task creation, editing, and deletion capabilities.',
        inputFormat: 'N/A (This is a buildathon challenge)',
        outputFormat: 'GitHub repository link with deployed application',
        constraints: 'Must use modern web technologies and include documentation',
        sampleInput: 'N/A',
        sampleOutput: 'GitHub repository with working application',
        type: 'buildathon',
        difficulty: 'hard',
        points: 300,
        testCases: [],
        isActive: true
      });
      
      await buildathonChallenge.save();
      console.log('✅ Created buildathon challenge:', buildathonChallenge.title);
    } else {
      buildathonChallenges.forEach(challenge => {
        console.log('- ID:', challenge._id, 'Title:', challenge.title, 'Points:', challenge.points);
      });
    }
    
    // Check CODEX team status
    const codexTeam = await Team.findOne({ name: 'CODEX' });
    if (codexTeam) {
      console.log('\n🎯 CODEX team status:');
      console.log('- Buildathon unlocked:', codexTeam.buildathonUnlocked);
      console.log('- Unlock code:', codexTeam.buildathonUnlockCode);
      console.log('- Points:', codexTeam.points);
      console.log('- Completed challenges:', codexTeam.completedChallenges.length);
      
      // Check if they have submitted any buildathon challenges
      const buildathonSubmissions = await Submission.find({ 
        team: codexTeam._id, 
        submissionType: 'github' 
      }).populate('challenge');
      
      console.log('- Buildathon submissions:', buildathonSubmissions.length);
      
      if (buildathonSubmissions.length > 0) {
        buildathonSubmissions.forEach(submission => {
          console.log(`  - ${submission.challenge.title}: ${submission.status}`);
        });
      }
    }
    
    // Check all teams with unlock codes
    const teamsWithUnlockCodes = await Team.find({ buildathonUnlockCode: { $exists: true } });
    console.log('\n📊 Teams with unlock codes:', teamsWithUnlockCodes.length);
    
    teamsWithUnlockCodes.forEach(team => {
      console.log(`- ${team.name}: ${team.buildathonUnlockCode} (unlocked: ${team.buildathonUnlocked})`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
