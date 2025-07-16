import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as TeamIcon,
  Assignment as ChallengeIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsAPI, challengesAPI } from '../services/api';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    maxMembers: 4
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch team data
        try {
          const teamResponse = await teamsAPI.getMyTeam();
          setTeam(teamResponse.data.team);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error('Error fetching team:', error);
          }
        }

        // Fetch available challenges
        const challengesResponse = await challengesAPI.getAll();
        
        // Handle new categorized response format
        if (challengesResponse.data.success) {
          const allChallenges = [
            ...(challengesResponse.data.algorithmic || []),
            ...(challengesResponse.data.buildathon || [])
          ];
          setChallenges(allChallenges);
        } else {
          // Fallback for legacy format
          setChallenges(challengesResponse.data.challenges || []);
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleCreateTeam = async () => {
    try {
      const response = await teamsAPI.create(teamFormData);
      setTeam(response.data.team);
      setCreateTeamOpen(false);
      setTeamFormData({ name: '', description: '', maxMembers: 4 });
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Points"
            value={team?.totalPoints || 0}
            icon={<TrophyIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Challenges Solved"
            value={team?.completedChallenges?.length || 0}
            icon={<ChallengeIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Team Name"
            value={team?.name || 'No Team'}
            icon={<TeamIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Team Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                My Team
              </Typography>
              {!team && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateTeamOpen(true)}
                >
                  Create Team
                </Button>
              )}
            </Box>
            
            {team ? (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  {team.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {team.description || 'No description provided'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Members ({team.members?.length}/{team.maxMembers}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {team.members?.map((member) => (
                      <Chip
                        key={member._id}
                        label={member.username}
                        variant={member._id === team.leader._id ? 'filled' : 'outlined'}
                        color={member._id === team.leader._id ? 'primary' : 'default'}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                {team.inviteCode && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Invite Code:
                    </Typography>
                    <Chip
                      label={team.inviteCode}
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(team.inviteCode);
                        toast.success('Invite code copied to clipboard!');
                      }}
                      clickable
                    />
                  </Box>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/team')}
                >
                  Manage Team
                </Button>
              </Box>
            ) : (
              <Alert severity="info">
                You haven't joined a team yet. Create a new team or join an existing one with an invite code.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Available Challenges */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Available Challenges
            </Typography>
            
            {challenges.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {challenges.map((challenge) => {
                  // Use the completion status from the API response
                  const isCompleted = challenge.isCompleted || false;
                  const isLocked = challenge.isLocked || false;
                  const isUnlocked = !isLocked;

                  return (
                    <Card
                      key={challenge._id}
                      sx={{ 
                        mb: 2, 
                        cursor: team && isUnlocked ? 'pointer' : 'default',
                        opacity: team && isUnlocked ? 1 : 0.6,
                        border: isCompleted ? '2px solid #4caf50' : '1px solid #e0e0e0'
                      }}
                      onClick={() => {
                        if (team && isUnlocked) {
                          navigate(`/challenges/${challenge._id}`);
                        } else if (!team) {
                          toast.warning('You need to be in a team to access challenges');
                        } else {
                          toast.warning('This challenge is locked');
                        }
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              {challenge.title || 'Untitled Challenge'}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                label={challenge.difficulty || 'unknown'}
                                size="small"
                                color={
                                  challenge.difficulty === 'easy' ? 'success' :
                                  challenge.difficulty === 'medium' ? 'warning' : 'error'
                                }
                              />
                              <Chip
                                label={challenge.type || 'algorithmic'}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="body2" color="textSecondary">
                                {challenge.points || 0} pts
                              </Typography>
                            </Box>
                            {!isUnlocked && team && (
                              <Typography variant="caption" color="error">
                                🔒 Locked
                              </Typography>
                            )}
                          </Box>
                          {isCompleted && (
                            <TrophyIcon color="warning" />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" textAlign="center">
                No challenges available. Check back later!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamFormData.name}
            onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={teamFormData.description}
            onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Maximum Members"
            type="number"
            fullWidth
            variant="outlined"
            value={teamFormData.maxMembers}
            onChange={(e) => setTeamFormData({ ...teamFormData, maxMembers: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTeamOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTeam} 
            variant="contained"
            disabled={!teamFormData.name.trim()}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDashboard;
