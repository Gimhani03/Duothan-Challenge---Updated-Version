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
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as TeamIcon,
  Assignment as ChallengeIcon,
  Speed as ProgressIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsAPI, challengesAPI, leaderboardAPI } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch challenges
        const challengesResponse = await challengesAPI.getAll();
        setChallenges(challengesResponse.data.challenges.slice(0, 5)); // Show first 5

        // Fetch leaderboard position (if user has team)
        if (team) {
          try {
            const leaderboardResponse = await leaderboardAPI.getMyTeam();
            setLeaderboardPosition(leaderboardResponse.data);
          } catch (error) {
            console.error('Error fetching leaderboard position:', error);
          }
        }

        // Fetch general stats
        const statsResponse = await leaderboardAPI.getStats();
        setStats(statsResponse.data);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [team?.id]);

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
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>
      
      {!team && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/team')}
            >
              Join/Create Team
            </Button>
          }
        >
          You need to join or create a team to participate in challenges.
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Your Team Rank"
            value={leaderboardPosition?.myTeamRank || 'N/A'}
            icon={<TrophyIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Points"
            value={team?.points || 0}
            icon={<ProgressIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Challenges Solved"
            value={team?.completedChallenges?.length || 0}
            icon={<ChallengeIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teams"
            value={stats?.totalTeams || 0}
            icon={<TeamIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Team Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom>
              Team Information
            </Typography>
            
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

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Invite Code: <strong>{team.inviteCode}</strong>
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/team')}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Manage Team
                </Button>
              </Box>
            ) : (
              <Box textAlign="center">
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  You're not part of any team yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/team')}
                  sx={{ mt: 2 }}
                >
                  Join or Create Team
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Challenges */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                Available Challenges
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/challenges')}
              >
                View All
              </Button>
            </Box>
            
            {challenges.length > 0 ? (
              <Box>
                {challenges.map((challenge) => (
                  <Card
                    key={challenge._id}
                    sx={{ mb: 2, cursor: 'pointer' }}
                    onClick={() => navigate(`/challenges/${challenge._id}`)}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {challenge.title}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center">
                            <Chip
                              label={challenge.difficulty}
                              size="small"
                              color={
                                challenge.difficulty === 'easy' ? 'success' :
                                challenge.difficulty === 'medium' ? 'warning' : 'error'
                              }
                            />
                            <Chip
                              label={challenge.type}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="body2" color="textSecondary">
                              {challenge.points} pts
                            </Typography>
                          </Box>
                        </Box>
                        {challenge.isCompleted && (
                          <TrophyIcon color="warning" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" textAlign="center">
                No challenges available. Check back later!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
