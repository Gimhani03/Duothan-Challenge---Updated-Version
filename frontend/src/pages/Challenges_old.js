import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { challengesAPI, teamsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Challenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [challenges, setChallenges] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        setChallenges(challengesResponse.data.challenges);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          You need to be in a team to access challenges. Please join or create a team first.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Challenges
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Complete challenges to earn points for your team. Some challenges may be locked until you complete prerequisites.
      </Typography>

      {challenges.length > 0 ? (
        <Grid container spacing={3}>
          {challenges.map((challenge) => {
            const isCompleted = team?.completedChallenges?.includes(challenge._id);
            const isUnlocked = challenge.unlockConditions?.length === 0 || 
              (team && challenge.unlockConditions?.every(condition => 
                team.completedChallenges?.includes(condition)
              ));

            return (
              <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                <Card
                  sx={{ 
                    height: '100%',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.6,
                    position: 'relative',
                    '&:hover': isUnlocked ? {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    } : {}
                  }}
                  onClick={() => {
                    if (isUnlocked) {
                      navigate(`/challenges/${challenge._id}`);
                    } else {
                      toast.warning('This challenge is locked');
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1, pr: 1 }}>
                        {challenge.title}
                      </Typography>
                      {isCompleted && <TrophyIcon color="warning" />}
                      {!isUnlocked && <LockIcon color="disabled" />}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {challenge.description}
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
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
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        {challenge.points} points
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {challenge.timeLimit}s time limit
                      </Typography>
                    </Box>
                    
                    {!isUnlocked && (
                      <Box mt={1}>
                        <Typography variant="caption" color="error">
                          🔒 Prerequisites required
                        </Typography>
                      </Box>
                    )}
                    
                    {isCompleted && (
                      <Box mt={1}>
                        <Typography variant="caption" color="success.main">
                          ✓ Completed
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No challenges available yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Check back later for new challenges!
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Challenges;
