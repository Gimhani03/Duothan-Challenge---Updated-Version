import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider
} from '@mui/material';
import {
  Code as AlgorithmIcon,
  Build as BuildathonIcon,
  Lock as LockIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as StartIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { challengesAPI } from '../services/api';
import { toast } from 'react-toastify';

const Challenges = () => {
  const navigate = useNavigate();
  const [algorithmicChallenges, setAlgorithmicChallenges] = useState([]);
  const [buildathonChallenges, setBuildathonChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAlgorithmicCompleted, setAllAlgorithmicCompleted] = useState(false);
  const [buildathonUnlocked, setBuildathonUnlocked] = useState(false);
  const [completedCount, setCompletedCount] = useState({ algorithmic: 0, total: 0 });
  
  // Unlock dialog states
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await challengesAPI.getAll();
      
      if (response.data.success) {
        setAlgorithmicChallenges(response.data.algorithmic || []);
        setBuildathonChallenges(response.data.buildathon || []);
        setAllAlgorithmicCompleted(response.data.allAlgorithmicCompleted);
        setBuildathonUnlocked(response.data.buildathonUnlocked);
        setCompletedCount(response.data.completedCount);
      } else {
        // Legacy format support
        const challenges = response.data.challenges || [];
        setAlgorithmicChallenges(challenges.filter(c => c.type === 'algorithmic'));
        setBuildathonChallenges(challenges.filter(c => c.type === 'buildathon'));
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUnlockCode = async () => {
    try {
      const response = await challengesAPI.generateUnlockCode();
      setGeneratedCode(response.data.unlockCode);
      setCodeDialogOpen(true);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error generating unlock code:', error);
      toast.error(error.response?.data?.message || 'Failed to generate unlock code');
    }
  };

  const handleUnlockBuildathon = async () => {
    try {
      const response = await challengesAPI.unlockBuildathon({ unlockCode });
      setBuildathonUnlocked(true);
      setUnlockDialogOpen(false);
      setUnlockCode('');
      toast.success(response.data.message);
      fetchChallenges(); // Refresh challenges
    } catch (error) {
      console.error('Error unlocking buildathon:', error);
      toast.error(error.response?.data?.message || 'Failed to unlock buildathon challenges');
    }
  };

  const ChallengeCard = ({ challenge, isLocked = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        opacity: isLocked ? 0.6 : 1,
        border: challenge.isCompleted ? '2px solid #4caf50' : '1px solid #e0e0e0'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Typography variant="h6" component="div">
            {challenge.title}
          </Typography>
          {challenge.isCompleted && (
            <CompletedIcon color="success" />
          )}
          {isLocked && (
            <LockIcon color="disabled" />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          {challenge.description}
        </Typography>
        
        <Box display="flex" gap={1} mb={2}>
          <Chip 
            label={challenge.difficulty} 
            size="small" 
            color={
              challenge.difficulty === 'easy' ? 'success' :
              challenge.difficulty === 'medium' ? 'warning' : 'error'
            }
          />
          <Chip 
            label={`${challenge.points} points`} 
            size="small" 
            variant="outlined"
          />
        </Box>
        
        <Button
          variant={challenge.isCompleted ? "outlined" : "contained"}
          fullWidth
          startIcon={isLocked ? <LockIcon /> : challenge.isCompleted ? <CompletedIcon /> : <StartIcon />}
          onClick={() => !isLocked && navigate(`/challenge/${challenge._id}`)}
          disabled={isLocked}
        >
          {isLocked ? 'Locked' : challenge.isCompleted ? 'Completed' : 'Start Challenge'}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading challenges...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Challenges
      </Typography>
      
      <Typography variant="body1" color="text.secondary" mb={4}>
        Complete algorithmic challenges to unlock buildathon challenges and showcase your skills!
      </Typography>

      {/* Algorithmic Challenges Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AlgorithmIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h4" component="h2" sx={{ color: '#1976d2' }}>
            Algorithmic Challenges
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Progress: {completedCount.algorithmic}/{completedCount.total} challenges completed
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={completedCount.total > 0 ? (completedCount.algorithmic / completedCount.total) * 100 : 0}
              sx={{ mt: 1, width: 300 }}
            />
          </Box>
          
          {allAlgorithmicCompleted && !buildathonUnlocked && (
            <Button
              variant="contained"
              color="success"
              startIcon={<TrophyIcon />}
              onClick={handleGenerateUnlockCode}
            >
              Get Buildathon Unlock Code
            </Button>
          )}
        </Box>

        {allAlgorithmicCompleted && (
          <Alert severity="success" sx={{ mb: 3 }}>
            🎉 Congratulations! You've completed all algorithmic challenges. 
            {!buildathonUnlocked && " Generate your unlock code to access buildathon challenges!"}
          </Alert>
        )}

        <Grid container spacing={3}>
          {algorithmicChallenges.map((challenge) => (
            <Grid item xs={12} md={6} lg={4} key={challenge._id}>
              <ChallengeCard challenge={challenge} />
            </Grid>
          ))}
        </Grid>

        {algorithmicChallenges.length === 0 && (
          <Alert severity="info">
            No algorithmic challenges available yet.
          </Alert>
        )}
      </Paper>

      {/* Buildathon Challenges Section */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <BuildathonIcon sx={{ mr: 1, color: '#ed6c02' }} />
          <Typography variant="h4" component="h2" sx={{ color: '#ed6c02' }}>
            Buildathon Challenges
          </Typography>
        </Box>

        {!buildathonUnlocked && (
          <Box mb={3}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">
                🔒 Buildathon challenges are locked. Complete all algorithmic challenges to unlock them.
              </Typography>
            </Alert>
            
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setUnlockDialogOpen(true)}
              disabled={!allAlgorithmicCompleted}
            >
              Enter Unlock Code
            </Button>
          </Box>
        )}

        {buildathonUnlocked && (
          <Alert severity="info" sx={{ mb: 3 }}>
            🏗️ Build amazing projects and showcase your creativity!
          </Alert>
        )}

        <Grid container spacing={3}>
          {buildathonChallenges.map((challenge) => (
            <Grid item xs={12} md={6} lg={4} key={challenge._id}>
              <ChallengeCard challenge={challenge} isLocked={!buildathonUnlocked} />
            </Grid>
          ))}
        </Grid>

        {buildathonChallenges.length === 0 && (
          <Alert severity="info">
            No buildathon challenges available yet.
          </Alert>
        )}
      </Paper>

      {/* Unlock Code Dialog */}
      <Dialog open={unlockDialogOpen} onClose={() => setUnlockDialogOpen(false)}>
        <DialogTitle>Unlock Buildathon Challenges</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the unlock code you received after completing all algorithmic challenges.
          </Typography>
          <TextField
            fullWidth
            label="Unlock Code"
            value={unlockCode}
            onChange={(e) => setUnlockCode(e.target.value)}
            placeholder="e.g., DUOTHANABCD1234"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUnlockBuildathon} 
            variant="contained"
            disabled={!unlockCode.trim()}
          >
            Unlock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generated Code Dialog */}
      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)}>
        <DialogTitle>🎉 Buildathon Unlock Code Generated!</DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            Congratulations on completing all algorithmic challenges! Here's your unlock code:
          </Typography>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
            <Typography variant="h5" component="div" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
              {generatedCode}
            </Typography>
          </Paper>
          <Typography variant="body2" color="text.secondary" mt={2}>
            Save this code and use it to unlock buildathon challenges!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => {
              setCodeDialogOpen(false);
              setUnlockDialogOpen(true);
              setUnlockCode(generatedCode);
            }}
            variant="contained"
          >
            Use Code Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Challenges;
