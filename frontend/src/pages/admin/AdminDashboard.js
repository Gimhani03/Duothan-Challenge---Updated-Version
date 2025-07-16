import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  Groups as TeamsIcon,
  EmojiEvents as ChallengesIcon,
  Assessment as StatsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, challengesAPI, leaderboardAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [teams, setTeams] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [teamViewDialogOpen, setTeamViewDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    problemStatement: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    explanation: '',
    difficulty: 'easy',
    type: 'algorithmic',
    points: 100,
    timeLimit: 2,
    memoryLimit: 256,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin dashboard stats
      try {
        const statsResponse = await adminAPI.getDashboard();
        if (statsResponse.data && statsResponse.data.stats) {
          setStats(statsResponse.data.stats);
        } else {
          console.warn('No stats in response:', statsResponse.data);
          setStats({});
        }
      } catch (error) {
        console.error('Error fetching stats:', error.response?.data || error.message);
        toast.error('Failed to load dashboard statistics');
      }

      // Fetch teams
      try {
        const teamsResponse = await adminAPI.getTeams();
        setTeams(teamsResponse.data.teams || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams data');
      }

      // Fetch challenges
      try {
        const challengesResponse = await challengesAPI.getAllAdmin();
        // Filter only active challenges for display
        const activeChallenges = (challengesResponse.data.challenges || []).filter(challenge => challenge.isActive !== false);
        setChallenges(activeChallenges);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        toast.error('Failed to load challenges data');
      }

      // Fetch users
      try {
        const usersResponse = await adminAPI.getUsers();
        setUsers(usersResponse.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users data');
      }

      // Fetch leaderboard
      try {
        const leaderboardResponse = await leaderboardAPI.get();
        setLeaderboard(leaderboardResponse.data.teams || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard data');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      // Basic validation
      if (!challengeForm.title.trim()) {
        toast.error('Challenge title is required');
        return;
      }
      if (!challengeForm.inputFormat.trim()) {
        toast.error('Input format is required');
        return;
      }
      if (!challengeForm.outputFormat.trim()) {
        toast.error('Output format is required');
        return;
      }
      if (!challengeForm.constraints.trim()) {
        toast.error('Constraints are required');
        return;
      }
      if (!challengeForm.sampleInput.trim()) {
        toast.error('Sample input is required');
        return;
      }
      if (!challengeForm.sampleOutput.trim()) {
        toast.error('Sample output is required');
        return;
      }

      if (editMode && selectedChallenge) {
        await challengesAPI.update(selectedChallenge._id, challengeForm);
        toast.success('Challenge updated successfully');
      } else {
        await challengesAPI.create(challengeForm);
        toast.success('Challenge created successfully');
      }
      
      setChallengeDialogOpen(false);
      setEditMode(false);
      setSelectedChallenge(null);
      resetChallengeForm();
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving challenge:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        validationErrors.forEach(err => toast.error(err.msg || err.message));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save challenge');
      }
    }
  };

  const handleEditChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      problemStatement: challenge.problemStatement,
      inputFormat: challenge.inputFormat,
      outputFormat: challenge.outputFormat,
      constraints: challenge.constraints,
      sampleInput: challenge.sampleInput,
      sampleOutput: challenge.sampleOutput,
      explanation: challenge.explanation || '',
      difficulty: challenge.difficulty,
      type: challenge.type,
      points: challenge.points,
      timeLimit: challenge.timeLimit,
      memoryLimit: challenge.memoryLimit,
    });
    setEditMode(true);
    setChallengeDialogOpen(true);
  };

  const handleDeleteChallenge = async () => {
    try {
      await challengesAPI.delete(challengeToDelete._id);
      toast.success('Challenge deleted successfully');
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    }
  };

  const resetChallengeForm = () => {
    setChallengeForm({
      title: '',
      description: '',
      problemStatement: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      sampleInput: '',
      sampleOutput: '',
      explanation: '',
      difficulty: 'easy',
      type: 'algorithmic',
      points: 100,
      timeLimit: 2,
      memoryLimit: 256,
    });
  };

  const handleViewTeam = async (team) => {
    try {
      setTeamDetailsLoading(true);
      setSelectedTeam(team);
      setTeamViewDialogOpen(true);
      
      // Fetch detailed team information with members
      const response = await adminAPI.getTeamDetails(team._id);
      setSelectedTeam(response.data.team);
    } catch (error) {
      console.error('Error fetching team details:', error);
      toast.error('Failed to load team details');
    } finally {
      setTeamDetailsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
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
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Chip 
          icon={<AdminIcon />} 
          label={`Welcome, ${user?.username}`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      <Typography variant="h3" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      <Button 
        variant="outlined" 
        onClick={fetchDashboardData}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        Refresh Statistics
      </Button>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Registered Teams"
            value={stats.totalTeams || teams.length || 0}
            icon={<TeamsIcon fontSize="large" />}
            color="#2e7d32"
            subtitle="Competition teams"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Challenges"
            value={stats.totalChallenges || challenges.length || 0}
            icon={<ChallengesIcon fontSize="large" />}
            color="#ed6c02"
            subtitle="Available challenges"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers || users.length || 0}
            icon={<UsersIcon fontSize="large" />}
            color="#1976d2"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions || 0}
            icon={<StatsIcon fontSize="large" />}
            color="#d32f2f"
            subtitle="From registered users"
          />
        </Grid>
      </Grid>

      {/* Submission Statistics */}
      {stats.breakdowns?.submissions && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Submission Statistics (Registered Users Only)
              </Typography>
              <Grid container spacing={2}>
                {stats.breakdowns.submissions.map((breakdown, index) => (
                  <Grid item xs={12} sm={6} md={3} key={breakdown._id || index}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <CardContent>
                        <Typography variant="h4" component="div" sx={{ 
                          color: breakdown._id === 'accepted' ? 'success.main' : 
                                breakdown._id === 'wrong_answer' ? 'error.main' :
                                breakdown._id === 'compilation_error' ? 'warning.main' :
                                'info.main'
                        }}>
                          {breakdown.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {breakdown._id ? breakdown._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                        </Typography>
                        <Chip 
                          label={`${((breakdown.count / (stats.totalSubmissions || 1)) * 100).toFixed(1)}%`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Admin Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Teams Overview" />
          <Tab label="Challenges Management" />
          <Tab label="Leaderboard" />
          <Tab label="Users Management" />
        </Tabs>

        {/* Teams Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teams Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team Name</TableCell>
                    <TableCell>Leader</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell>Points</TableCell>
                    <TableCell>Challenges Completed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team._id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.leader?.username}</TableCell>
                      <TableCell>{team.members?.length}/{team.maxMembers}</TableCell>
                      <TableCell>{team.totalPoints || 0}</TableCell>
                      <TableCell>{team.completedChallenges?.length || 0}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewTeam(team)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {teams.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No teams registered yet.
              </Alert>
            )}
          </Box>
        )}

        {/* Challenges Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Challenges Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditMode(false);
                  setSelectedChallenge(null);
                  resetChallengeForm();
                  setChallengeDialogOpen(true);
                }}
              >
                Create Challenge
              </Button>
            </Box>

            {/* Algorithmic Challenges Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
                🧮 Algorithmic Challenges
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Time Limit</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {challenges.filter(c => c.type === 'algorithmic').map((challenge) => (
                      <TableRow key={challenge._id}>
                        <TableCell>{challenge.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={challenge.difficulty} 
                            size="small" 
                            color={
                              challenge.difficulty === 'easy' ? 'success' :
                              challenge.difficulty === 'medium' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{challenge.points}</TableCell>
                        <TableCell>{challenge.timeLimit}s</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => handleEditChallenge(challenge)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<DeleteIcon />} 
                            color="error"
                            onClick={() => {
                              setChallengeToDelete(challenge);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {challenges.filter(c => c.type === 'algorithmic').length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No algorithmic challenges created yet.
                </Alert>
              )}
            </Paper>

            {/* Buildathon Challenges Section */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#ed6c02', mb: 2 }}>
                🏗️ Buildathon Challenges
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Time Limit</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {challenges.filter(c => c.type === 'buildathon').map((challenge) => (
                      <TableRow key={challenge._id}>
                        <TableCell>{challenge.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={challenge.difficulty} 
                            size="small" 
                            color={
                              challenge.difficulty === 'easy' ? 'success' :
                              challenge.difficulty === 'medium' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{challenge.points}</TableCell>
                        <TableCell>{challenge.timeLimit}s</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => handleEditChallenge(challenge)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<DeleteIcon />} 
                            color="error"
                            onClick={() => {
                              setChallengeToDelete(challenge);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {challenges.filter(c => c.type === 'buildathon').length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No buildathon challenges created yet.
                </Alert>
              )}
            </Paper>
          </Box>
        )}

        {/* Leaderboard Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Competition Leaderboard
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Team Name</TableCell>
                    <TableCell>Leader</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell>Total Points</TableCell>
                    <TableCell>Challenges Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((team, index) => (
                    <TableRow key={team._id}>
                      <TableCell>
                        <Chip 
                          label={`#${index + 1}`} 
                          color={index === 0 ? 'warning' : index === 1 ? 'default' : index === 2 ? 'info' : 'default'}
                          variant={index < 3 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.leader?.username}</TableCell>
                      <TableCell>{team.members?.length}</TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {team.totalPoints || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>{team.completedChallenges?.length || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {leaderboard.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No teams have earned points yet.
              </Alert>
            )}
          </Box>
        )}

        {/* Users Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Users Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          size="small" 
                          color={user.role === 'admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{user.team?.name || 'No Team'}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<ViewIcon />}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {users.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No users registered yet.
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Create/Edit Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onClose={() => {
        setChallengeDialogOpen(false);
        setEditMode(false);
        setSelectedChallenge(null);
        resetChallengeForm();
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Challenge' : 'Create New Challenge'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Challenge Title"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={challengeForm.description}
                onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Problem Statement"
                multiline
                rows={4}
                value={challengeForm.problemStatement}
                onChange={(e) => setChallengeForm({ ...challengeForm, problemStatement: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Input Format"
                multiline
                rows={2}
                value={challengeForm.inputFormat}
                onChange={(e) => setChallengeForm({ ...challengeForm, inputFormat: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Output Format"
                multiline
                rows={2}
                value={challengeForm.outputFormat}
                onChange={(e) => setChallengeForm({ ...challengeForm, outputFormat: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Constraints"
                multiline
                rows={2}
                value={challengeForm.constraints}
                onChange={(e) => setChallengeForm({ ...challengeForm, constraints: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sample Input"
                multiline
                rows={3}
                value={challengeForm.sampleInput}
                onChange={(e) => setChallengeForm({ ...challengeForm, sampleInput: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sample Output"
                multiline
                rows={3}
                value={challengeForm.sampleOutput}
                onChange={(e) => setChallengeForm({ ...challengeForm, sampleOutput: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Explanation (Optional)"
                multiline
                rows={2}
                value={challengeForm.explanation}
                onChange={(e) => setChallengeForm({ ...challengeForm, explanation: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={challengeForm.difficulty}
                  onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value })}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value })}
                >
                  <MenuItem value="algorithmic">Algorithmic</MenuItem>
                  <MenuItem value="buildathon">Buildathon</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={challengeForm.points}
                onChange={(e) => setChallengeForm({ ...challengeForm, points: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Time Limit (seconds)"
                type="number"
                value={challengeForm.timeLimit}
                onChange={(e) => setChallengeForm({ ...challengeForm, timeLimit: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Memory Limit (MB)"
                type="number"
                value={challengeForm.memoryLimit}
                onChange={(e) => setChallengeForm({ ...challengeForm, memoryLimit: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setChallengeDialogOpen(false);
            setEditMode(false);
            setSelectedChallenge(null);
            resetChallengeForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleCreateChallenge} variant="contained">
            {editMode ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Challenge</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{challengeToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteChallenge} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team View Dialog */}
      <Dialog 
        open={teamViewDialogOpen} 
        onClose={() => {
          setTeamViewDialogOpen(false);
          setSelectedTeam(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Team Details: {selectedTeam?.name}
        </DialogTitle>
        <DialogContent>
          {teamDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : selectedTeam ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Team Leader
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTeam.leader?.username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Invite Code
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTeam.inviteCode || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Total Points
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTeam.totalPoints || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Challenges Completed
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTeam.completedChallenges?.length || 0}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                Team Members ({selectedTeam.members?.length || 0}/{selectedTeam.maxMembers || 4})
              </Typography>
              
              {selectedTeam.members && selectedTeam.members.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Joined Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTeam.members.map((member, index) => (
                        <TableRow key={member._id || index}>
                          <TableCell>{member.username}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Chip 
                              label={member._id === selectedTeam.leader?._id ? 'Leader' : 'Member'} 
                              size="small"
                              color={member._id === selectedTeam.leader?._id ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No members found in this team.
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="error">
              Failed to load team details.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTeamViewDialogOpen(false);
              setSelectedTeam(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
