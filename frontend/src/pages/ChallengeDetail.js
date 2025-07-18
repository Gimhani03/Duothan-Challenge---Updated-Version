import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  PlayArrow as RunIcon,
  Save as SubmitIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { challengesAPI, submissionsAPI, teamsAPI } from '../services/api';
import { toast } from 'react-toastify';
import CodeEditor from '../components/CodeEditor';

const ChallengeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [team, setTeam] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);
  const [testInput, setTestInput] = useState('');
  
  // Buildathon submission state
  const [githubUrl, setGithubUrl] = useState('');
  const [submittingGithub, setSubmittingGithub] = useState(false);

  // Language templates
  const getLanguageTemplate = (lang) => {
    const templates = {
      python: '# Write your solution here\ndef solve():\n    pass\n\nsolve()',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
      javascript: '// Write your solution here\nfunction solve() {\n    \n}\n\nsolve();',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}'
    };
    return templates[lang] || templates.python;
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (!code.trim() || code === getLanguageTemplate(language)) {
      setCode(getLanguageTemplate(newLanguage));
    }
  };

  // Initialize code template when component mounts
  useEffect(() => {
    if (!code) {
      setCode(getLanguageTemplate(language));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

        // Fetch challenge details
        const challengeResponse = await challengesAPI.getById(id);
        setChallenge(challengeResponse.data.challenge);

        // Fetch previous submissions
        try {
          const submissionsResponse = await submissionsAPI.getMyChallengeSubmissions(id);
          setSubmissions(submissionsResponse.data.submissions);
          
          // Load the last successful submission's code
          const lastSubmission = submissionsResponse.data.submissions[0];
          if (lastSubmission) {
            setCode(lastSubmission.code);
            setLanguage(lastSubmission.language);
          }
        } catch (error) {
          console.error('Error fetching submissions:', error);
        }

      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast.error('Failed to load challenge');
        navigate('/challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.warning('Please write some code first');
      return;
    }

    try {
      setRunning(true);
      setExecutionResult(null);
      
      const response = await submissionsAPI.run({
        code,
        language,
        input: testInput
      });

      if (response.data.success) {
        setExecutionResult(response.data.result);
        
        // Show appropriate message based on execution result
        if (response.data.result.statusId === 3) { // Accepted
          toast.success('Code executed successfully!');
        } else if (response.data.result.statusId === 6) { // Compilation Error
          toast.error('Compilation Error');
        } else if (response.data.result.statusId === 5) { // Time Limit Exceeded
          toast.warning('Time Limit Exceeded');
        } else if (response.data.result.statusId >= 7 && response.data.result.statusId <= 12) { // Runtime Errors
          toast.error('Runtime Error');
        } else {
          toast.info(`Execution completed with status: ${response.data.result.status}`);
        }
      } else {
        toast.error('Failed to execute code');
      }
    } catch (error) {
      console.error('Error running code:', error);
      toast.error(error.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.warning('Please write some code first');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Uploading solution to Judge0 API...', { autoClose: 2000 });
      
      const response = await submissionsAPI.submitCode({
        challengeId: id,
        code,
        language
      });

      if (response.data.submission.status === 'accepted') {
        toast.success('Challenge completed successfully! 🎉');
        
        // Check if unlock code was generated
        if (response.data.unlockCode && response.data.unlockCode.generated) {
          toast.success(response.data.unlockCode.message, { 
            autoClose: 10000, // Show for 10 seconds
            hideProgressBar: false 
          });
          
          // Show unlock code in a more prominent way
          setTimeout(() => {
            toast.info(`🔑 Your Buildathon Unlock Code: ${response.data.unlockCode.code}`, {
              autoClose: 15000, // Show for 15 seconds
              hideProgressBar: false
            });
          }, 1000);
        }
        
        // Refresh team data to update completed challenges
        const teamResponse = await teamsAPI.getMyTeam();
        setTeam(teamResponse.data.team);
      } else {
        // Show detailed error message based on status
        const statusMessages = {
          'wrong_answer': 'Wrong Answer - Your output does not match the expected output',
          'compilation_error': 'Compilation Error - There are syntax errors in your code',
          'runtime_error': 'Runtime Error - Your code crashed during execution',
          'time_limit_exceeded': 'Time Limit Exceeded - Your code took too long to execute'
        };
        
        const message = statusMessages[response.data.submission.status] || 
                       `Solution not accepted: ${response.data.submission.status}`;
        
        toast.error(message);
        
        // Show test case results if available
        if (response.data.submission.testCaseResults) {
          const passedCount = response.data.submission.testCaseResults.filter(r => r.isCorrect).length;
          const totalCount = response.data.submission.testCaseResults.length;
          toast.info(`Test Cases: ${passedCount}/${totalCount} passed`);
        }
      }

      // Refresh submissions
      const submissionsResponse = await submissionsAPI.getMyChallengeSubmissions(id);
      setSubmissions(submissionsResponse.data.submissions);

    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error(error.response?.data?.message || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle buildathon submission
  const handleBuildathonSubmit = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL');
      return;
    }

    try {
      setSubmittingGithub(true);
      
      const response = await submissionsAPI.submitGithub({
        challengeId: id,
        githubUrl: githubUrl.trim()
      });

      if (response.data.pointsAwarded > 0) {
        toast.success(`🎉 ${response.data.message} - ${response.data.pointsAwarded} points awarded!`);
      } else {
        toast.success(response.data.message);
      }

      // Refresh team data to update completed challenges
      const teamResponse = await teamsAPI.getMyTeam();
      setTeam(teamResponse.data.team);
      
      // Refresh challenge data to update completion status
      const challengeResponse = await challengesAPI.getById(id);
      setChallenge(challengeResponse.data.challenge);

    } catch (error) {
      console.error('Error submitting GitHub URL:', error);
      toast.error(error.response?.data?.message || 'Failed to submit GitHub URL');
    } finally {
      setSubmittingGithub(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          You need to be in a team to access challenges.
        </Alert>
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Challenge not found.
        </Alert>
      </Container>
    );
  }

  const isCompleted = team?.completedChallenges?.includes(challenge._id);
  const isUnlocked = challenge.unlockConditions?.length === 0 || 
    (team && challenge.unlockConditions?.every(condition => 
      team.completedChallenges?.includes(condition)
    ));

  if (!isUnlocked) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          This challenge is locked. Complete the prerequisite challenges first.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Challenge Information */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h4" component="h1">
                {challenge.title}
              </Typography>
              {isCompleted && <TrophyIcon color="warning" fontSize="large" />}
            </Box>
            
            <Box display="flex" gap={1} mb={3}>
              <Chip
                label={challenge.difficulty}
                color={
                  challenge.difficulty === 'easy' ? 'success' :
                  challenge.difficulty === 'medium' ? 'warning' : 'error'
                }
              />
              <Chip label={challenge.type} variant="outlined" />
              <Chip label={`${challenge.points} points`} color="primary" />
              <Chip label={`${challenge.timeLimit}s`} variant="outlined" />
            </Box>

            <Typography variant="body1" paragraph>
              {challenge.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Problem Statement
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {challenge.problemStatement}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Input Format
            </Typography>
            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {challenge.inputFormat}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Output Format
            </Typography>
            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {challenge.outputFormat}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Constraints
            </Typography>
            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {challenge.constraints}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Sample Input
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                {challenge.sampleInput}
              </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom>
              Sample Output
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                {challenge.sampleOutput}
              </Typography>
            </Paper>

            {challenge.explanation && (
              <>
                <Typography variant="h6" gutterBottom>
                  Explanation
                </Typography>
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {challenge.explanation}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Solution Section */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                {challenge.type === 'buildathon' ? 'Project Submission' : 'Solution'}
              </Typography>
              
              {challenge.type === 'algorithmic' && (
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<RunIcon />}
                    onClick={handleRunCode}
                    disabled={running || submitting}
                  >
                    {running ? 'Running...' : 'Run'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={handleSubmit}
                    disabled={submitting || isCompleted}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </Box>
              )}
            </Box>

            {challenge.type === 'algorithmic' ? (
              <>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  height="400px"
                />

                {/* Test Input Section */}
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Test Input (Optional)"
                    placeholder="Enter custom input for testing..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </>
            ) : (
              /* Buildathon Submission Form */
              <Box>
                <Typography variant="body1" color="text.secondary" mb={2}>
                  Submit your GitHub repository containing the complete project solution.
                </Typography>
                
                <TextField
                  fullWidth
                  label="GitHub Repository URL"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={handleBuildathonSubmit}
                    disabled={submittingGithub || isCompleted}
                    fullWidth
                  >
                    {submittingGithub ? 'Submitting...' : 'Submit Project'}
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Requirements:</strong><br/>
                    • Include a detailed README.md with setup instructions<br/>
                    • Provide live demo link (if applicable)<br/>
                    • Include screenshots or demo videos<br/>
                    • Document all dependencies and installation steps
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Execution Results - Only for algorithmic challenges */}
            {challenge.type === 'algorithmic' && executionResult && (
              <Box sx={{ mt: 2 }}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="execution-results"
                    id="execution-results-header"
                  >
                    <Typography variant="h6">
                      Execution Results - {executionResult.status}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Status: <Chip 
                          label={executionResult.status} 
                          color={executionResult.statusId === 3 ? 'success' : 'error'}
                          size="small"
                        />
                      </Typography>
                      
                      {executionResult.output && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Output:</Typography>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {executionResult.output}
                          </Paper>
                        </Box>
                      )}
                      
                      {executionResult.error && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="error">Error:</Typography>
                          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {executionResult.error}
                          </Paper>
                        </Box>
                      )}
                      
                      {executionResult.compileOutput && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="warning.main">Compile Output:</Typography>
                          <Paper sx={{ p: 2, bgcolor: 'warning.light', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {executionResult.compileOutput}
                          </Paper>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Typography variant="body2">
                          Time: {executionResult.time}s
                        </Typography>
                        <Typography variant="body2">
                          Memory: {executionResult.memory || 0} KB
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            {isCompleted && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ✅ Challenge completed! You've earned {challenge.points} points.
              </Alert>
            )}

            {/* Recent Submissions - Only for algorithmic challenges */}
            {challenge.type === 'algorithmic' && submissions.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Submissions
                </Typography>
                {submissions.slice(0, 3).map((submission, index) => (
                  <Box key={submission._id} sx={{ mb: 1 }}>
                    <Chip
                      label={submission.status}
                      size="small"
                      color={submission.status === 'accepted' ? 'success' : 'error'}
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {new Date(submission.submittedAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Submission History - Only for algorithmic challenges */}
            {challenge.type === 'algorithmic' && submissions.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Submissions (Judge0 Validated)
                </Typography>
                {submissions.slice(0, 3).map((submission, index) => (
                  <Accordion key={submission._id} sx={{ mb: 1 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`submission-${index}`}
                      id={`submission-${index}-header`}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="subtitle1">
                          Submission #{submissions.length - index}
                        </Typography>
                        <Chip 
                          label={submission.status || 'pending'} 
                          color={submission.status === 'accepted' ? 'success' : 'error'}
                          size="small"
                        />
                        <Typography variant="caption" sx={{ ml: 'auto' }}>
                          {new Date(submission.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Language: <Chip label={submission.language} size="small" variant="outlined" />
                        </Typography>
                        
                        {submission.testCaseResults && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Judge0 Test Case Results:
                            </Typography>
                            {submission.testCaseResults.map((result, idx) => (
                              <Box key={idx} sx={{ mt: 1, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="body2">Test Case {idx + 1}:</Typography>
                                  <Chip 
                                    label={result.isCorrect ? 'PASSED' : 'FAILED'} 
                                    color={result.isCorrect ? 'success' : 'error'}
                                    size="small"
                                  />
                                  <Typography variant="caption">
                                    Status: {result.status}
                                  </Typography>
                                  {result.executionTime && (
                                    <Typography variant="caption">
                                      Time: {result.executionTime}s
                                    </Typography>
                                  )}
                                </Box>
                                
                                {result.output && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block">Your Output:</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                      "{result.output.trim()}"
                                    </Paper>
                                  </Box>
                                )}
                                
                                {!result.isCorrect && result.expectedOutput && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block">Expected Output:</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'success.light', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                      "{result.expectedOutput.trim()}"
                                    </Paper>
                                  </Box>
                                )}
                                
                                {result.error && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block" color="error">Error:</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'error.light', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                      {result.error}
                                    </Paper>
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            ✅ Code uploaded and validated through Judge0 CE API
                          </Typography>
                          <Typography variant="caption" display="block">
                            🏗️ Executed on Judge0 servers at {process.env.REACT_APP_JUDGE0_URL || 'http://10.3.5.139:2358/'}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChallengeDetail;
