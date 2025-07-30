const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxMembers: {
    type: Number,
    default: 4,
    min: 1,
    max: 10
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  points: {
    type: Number,
    default: 0
  },
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  completedChallenges: [{
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    points: Number,
    isCorrect: {
      type: Boolean,
      default: false
    },
    pointsAwarded: {
      type: Boolean,
      default: false
    }
  }],
  buildathonUnlocked: {
    type: Boolean,
    default: false
  },
  buildathonUnlockCode: {
    type: String
  },
  buildathonUnlockedAt: {
    type: Date
  },
  // Store required challenges at team creation time for versioned requirements
  requiredChallenges: [{
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    challengeTitle: String,
    addedAt: Date
  }]
}, {
  timestamps: true
});

// Generate unique invite code before validation
teamSchema.pre('validate', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

// Capture required challenges when team is created
teamSchema.pre('save', async function(next) {
  if (this.isNew && this.requiredChallenges.length === 0) {
    const Challenge = require('./Challenge');
    
    try {
      // Get all active algorithmic challenges at team creation time
      const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
      
      this.requiredChallenges = algorithmicChallenges.map(challenge => ({
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        addedAt: challenge.createdAt
      }));
      
      console.log(`📝 Team ${this.name} created with ${this.requiredChallenges.length} required challenges`);
    } catch (error) {
      console.error('Error setting required challenges for team:', error);
    }
  }
  next();
});

// Helper method to check if team qualifies for unlock code
teamSchema.methods.checkAndGenerateUnlockCode = async function() {
  const Challenge = require('./Challenge');
  
  try {
    // Use team's required challenges if available, otherwise fall back to current challenges
    let requiredChallenges;
    
    if (this.requiredChallenges && this.requiredChallenges.length > 0) {
      // Get the actual challenge documents for required challenges
      const requiredChallengeIds = this.requiredChallenges.map(rc => rc.challengeId);
      requiredChallenges = await Challenge.find({ 
        _id: { $in: requiredChallengeIds }, 
        type: 'algorithmic', 
        isActive: true 
      });
      
      console.log(`🎯 Team ${this.name} using versioned requirements: ${requiredChallenges.length} challenges`);
    } else {
      // Fallback for older teams without versioned requirements
      requiredChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
      console.log(`🔄 Team ${this.name} using current challenges (no versioning): ${requiredChallenges.length} challenges`);
    }
    
    if (requiredChallenges.length === 0) {
      return false; // No required challenges
    }
    
    // Ensure completedChallenges is populated
    if (!this.populated('completedChallenges.challengeId')) {
      await this.populate('completedChallenges.challengeId');
    }
    
    // Get completed challenge IDs (regardless of correctness)
    const completedChallengeIds = this.completedChallenges
      .filter(cc => cc.challengeId !== null)
      .map(cc => cc.challengeId._id ? cc.challengeId._id.toString() : cc.challengeId.toString());
    
    // Count completed required challenges
    const completedRequiredCount = requiredChallenges.filter(challenge => 
      completedChallengeIds.includes(challenge._id.toString())
    ).length;
    
    console.log(`🔍 Checking team ${this.name}:`);
    console.log(`   - Required challenges: ${requiredChallenges.length}`);
    console.log(`   - Completed: ${completedRequiredCount}`);
    console.log(`   - Completed challenge IDs: ${completedChallengeIds.join(', ')}`);
    console.log(`   - Current unlock code: ${this.buildathonUnlockCode || 'None'}`);
    
    // Check if all required challenges are completed
    if (completedRequiredCount === requiredChallenges.length) {
      // Generate unlock code if not already generated
      if (!this.buildathonUnlockCode) {
        const unlockCode = `DUOTHAN${Math.random().toString(36).substring(2, 8).toUpperCase()}BUILD${Date.now().toString().slice(-4)}`;
        this.buildathonUnlockCode = unlockCode;
        await this.save();
        
        console.log(`🎉 Auto-generated unlock code for team ${this.name}: ${unlockCode}`);
        console.log(`   - Completed ${completedRequiredCount}/${requiredChallenges.length} required challenges`);
        
        return true; // Code was generated
      }
      return false; // Code already exists
    }
    
    return false; // Not all required challenges completed
  } catch (error) {
    console.error('Error checking unlock code for team:', this.name, error);
    return false;
  }
};

// Static method to check all teams for unlock code generation
teamSchema.statics.checkAllTeamsForUnlockCodes = async function() {
  const Challenge = require('./Challenge');
  
  try {
    console.log('🔄 Checking all teams for unlock code eligibility...');
    
    // Get all active algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    console.log(`📊 Current active algorithmic challenges: ${algorithmicChallenges.length}`);
    
    if (algorithmicChallenges.length === 0) {
      console.log('⚠️ No algorithmic challenges found, skipping unlock code generation');
      return;
    }
    
    // Get all active teams
    const teams = await this.find({ isActive: true }).populate('completedChallenges.challengeId');
    console.log(`📊 Teams to check: ${teams.length}`);
    
    let codesGenerated = 0;
    
    for (const team of teams) {
      const codeGenerated = await team.checkAndGenerateUnlockCode();
      if (codeGenerated) {
        codesGenerated++;
      }
    }
    
    console.log(`✅ Unlock code check completed. Generated ${codesGenerated} new codes.`);
    return codesGenerated;
    
  } catch (error) {
    console.error('Error checking all teams for unlock codes:', error);
    return 0;
  }
};

// Static method to migrate existing teams to versioned requirements
teamSchema.statics.migrateTeamsToVersionedRequirements = async function() {
  const Challenge = require('./Challenge');
  
  try {
    console.log('🔄 Migrating existing teams to versioned requirements...');
    
    // Get all teams without versioned requirements
    const teamsToMigrate = await this.find({ 
      isActive: true, 
      $or: [
        { requiredChallenges: { $exists: false } },
        { requiredChallenges: { $size: 0 } }
      ]
    });
    
    console.log(`📊 Teams to migrate: ${teamsToMigrate.length}`);
    
    if (teamsToMigrate.length === 0) {
      console.log('✅ No teams need migration');
      return 0;
    }
    
    // Get all active algorithmic challenges
    const algorithmicChallenges = await Challenge.find({ type: 'algorithmic', isActive: true });
    
    let migratedCount = 0;
    
    for (const team of teamsToMigrate) {
      // Set required challenges to current challenges (preserving existing behavior)
      team.requiredChallenges = algorithmicChallenges.map(challenge => ({
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        addedAt: challenge.createdAt
      }));
      
      await team.save();
      migratedCount++;
      
      console.log(`✅ Migrated team ${team.name} with ${team.requiredChallenges.length} required challenges`);
    }
    
    console.log(`🎉 Migration completed. Migrated ${migratedCount} teams.`);
    return migratedCount;
    
  } catch (error) {
    console.error('Error migrating teams to versioned requirements:', error);
    return 0;
  }
};

module.exports = mongoose.model('Team', teamSchema);
