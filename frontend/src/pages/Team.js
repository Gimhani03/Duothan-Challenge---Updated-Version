import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  ExitToApp as LeaveIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { teamsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Team = () => {
  const { user, updateUser } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    maxMembers: 4,
  });
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getMyTeam();
      setTeam(response.data.team);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching team:', error);
        toast.error('Failed to load team data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      console.log('Creating team with data:', teamData);
      
      // Client-side validation
      if (!teamData.name || teamData.name.trim().length < 3) {
        toast.error('Team name must be at least 3 characters long');
        return;
      }
      
      if (teamData.name.length > 50) {
        toast.error('Team name must be no more than 50 characters');
        return;
      }
      
      if (teamData.description && teamData.description.length > 200) {
        toast.error('Description must be no more than 200 characters');
        return;
      }
      
      const response = await teamsAPI.create(teamData);
      setTeam(response.data.team);
      updateUser({ team: response.data.team._id });
      setCreateDialogOpen(false);
      setTeamData({ name: '', description: '', maxMembers: 4 });
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Team creation error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid team data';
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        toast.error('You need to be logged in to create a team');
      } else if (error.response?.status === 403) {
        toast.error('You don\'t have permission to create a team');
      } else {
        toast.error('Failed to create team. Please try again.');
      }
    }
  };

  const handleJoinTeam = async () => {
    try {
      const response = await teamsAPI.join(inviteCode);
      setTeam(response.data.team);
      updateUser({ team: response.data.team._id });
      setJoinDialogOpen(false);
      setInviteCode('');
      toast.success('Joined team successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join team');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      await teamsAPI.leave();
      setTeam(null);
      updateUser({ team: null });
      toast.success('Left team successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave team');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Team Management
      </Typography>

      {team ? (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" color="primary">
              {team.name}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LeaveIcon />}
              onClick={handleLeaveTeam}
            >
              Leave Team
            </Button>
          </Box>

          {team.description && (
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {team.description}
            </Typography>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Stats
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Points: <strong>{team.points}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Challenges Completed: <strong>{team.completedChallenges?.length || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Members: <strong>{team.members?.length}/{team.maxMembers}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invite Members
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      size="small"
                      value={team.inviteCode}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      onClick={copyInviteCode}
                      startIcon={<CopyIcon />}
                    >
                      Copy
                    </Button>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Share this code with others to invite them to your team
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Team Members
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {team.members?.map((member) => (
              <Chip
                key={member._id}
                label={`${member.username}${member._id === team.leader._id ? ' (Leader)' : ''}`}
                variant={member._id === team.leader._id ? 'filled' : 'outlined'}
                color={member._id === team.leader._id ? 'primary' : 'default'}
                icon={<GroupIcon />}
              />
            ))}
          </Box>

          {team.completedChallenges?.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Completed Challenges
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {team.completedChallenges.map((completion, index) => (
                  <Chip
                    key={index}
                    label={`${completion.challengeId?.title || 'Challenge'} (+${completion.points} pts)`}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            You're not part of any team
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Join an existing team or create your own to start competing!
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Team
            </Button>
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => setJoinDialogOpen(true)}
            >
              Join Team
            </Button>
          </Box>
        </Paper>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamData.name}
            onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
            sx={{ mb: 2 }}
            error={teamData.name.length > 0 && teamData.name.length < 3}
            helperText={
              teamData.name.length > 0 && teamData.name.length < 3 
                ? 'Team name must be at least 3 characters' 
                : teamData.name.length > 50 
                  ? 'Team name must be no more than 50 characters'
                  : 'Enter a unique team name'
            }
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={teamData.description}
            onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
            sx={{ mb: 2 }}
            error={teamData.description.length > 200}
            helperText={
              teamData.description.length > 200 
                ? 'Description must be no more than 200 characters'
                : `${teamData.description.length}/200 characters`
            }
          />
          <TextField
            margin="dense"
            label="Maximum Members"
            type="number"
            fullWidth
            variant="outlined"
            value={teamData.maxMembers}
            onChange={(e) => setTeamData({ ...teamData, maxMembers: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTeam} 
            variant="contained" 
            disabled={
              !teamData.name.trim() || 
              teamData.name.length < 3 || 
              teamData.name.length > 50 ||
              teamData.description.length > 200
            }
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Team Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Join Team</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter the invite code provided by your team leader
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Invite Code"
            fullWidth
            variant="outlined"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter team invite code"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinTeam} variant="contained" disabled={!inviteCode.trim()}>
            Join Team
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Team;
