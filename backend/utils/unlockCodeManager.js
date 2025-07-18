const Team = require('../models/Team');
const Challenge = require('../models/Challenge');

class UnlockCodeManager {
  // Initialize unlock code system on server startup
  static async initialize() {
    try {
      console.log('🚀 Initializing unlock code system...');
      
      // First, migrate existing teams to versioned requirements
      await Team.migrateTeamsToVersionedRequirements();
      
      // Then check all teams for unlock code eligibility
      const codesGenerated = await Team.checkAllTeamsForUnlockCodes();
      
      console.log(`✅ Unlock code system initialized. Generated ${codesGenerated} codes for existing teams.`);
      return codesGenerated;
      
    } catch (error) {
      console.error('❌ Error initializing unlock code system:', error);
      return 0;
    }
  }

  // Check and generate unlock codes for a specific team
  static async checkTeam(teamId) {
    try {
      const team = await Team.findById(teamId).populate('completedChallenges.challengeId');
      if (!team) {
        console.log(`⚠️ Team not found: ${teamId}`);
        return false;
      }
      
      return await team.checkAndGenerateUnlockCode();
      
    } catch (error) {
      console.error(`❌ Error checking team ${teamId}:`, error);
      return false;
    }
  }

  // Check all teams when challenges are updated
  static async checkAllTeams() {
    try {
      return await Team.checkAllTeamsForUnlockCodes();
    } catch (error) {
      console.error('❌ Error checking all teams:', error);
      return 0;
    }
  }

  // Get current system status
  static async getSystemStatus() {
    try {
      const totalTeams = await Team.countDocuments({ isActive: true });
      const teamsWithCodes = await Team.countDocuments({ 
        isActive: true, 
        buildathonUnlockCode: { $exists: true, $ne: null } 
      });
      const algorithmicChallenges = await Challenge.countDocuments({ 
        type: 'algorithmic', 
        isActive: true 
      });
      
      return {
        totalTeams,
        teamsWithCodes,
        teamsWithoutCodes: totalTeams - teamsWithCodes,
        algorithmicChallenges,
        systemHealth: totalTeams > 0 ? Math.round((teamsWithCodes / totalTeams) * 100) : 0
      };
      
    } catch (error) {
      console.error('❌ Error getting system status:', error);
      return {
        totalTeams: 0,
        teamsWithCodes: 0,
        teamsWithoutCodes: 0,
        algorithmicChallenges: 0,
        systemHealth: 0
      };
    }
  }

  // Force regenerate unlock codes for all teams (admin utility)
  static async forceRegenerateAll() {
    try {
      console.log('🔄 Force regenerating all unlock codes...');
      
      // Clear all existing unlock codes
      await Team.updateMany(
        { isActive: true },
        { $unset: { buildathonUnlockCode: 1 } }
      );
      
      console.log('🧹 Cleared all existing unlock codes');
      
      // Generate new codes for qualifying teams
      const codesGenerated = await Team.checkAllTeamsForUnlockCodes();
      
      console.log(`✅ Force regeneration completed. Generated ${codesGenerated} new codes.`);
      return codesGenerated;
      
    } catch (error) {
      console.error('❌ Error during force regeneration:', error);
      return 0;
    }
  }
}

module.exports = UnlockCodeManager;
