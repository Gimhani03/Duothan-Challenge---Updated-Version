import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const CodeEditor = ({ value, onChange, language, onLanguageChange, height = '400px', onSubmit, loading, submissionResult, showSubmitButton = false }) => {
  const editorRef = useRef(null);

  const languages = [
    { value: 'python', label: 'Python 3', monacoLang: 'python' },
    { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
    { value: 'java', label: 'Java', monacoLang: 'java' },
    { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
    { value: 'c', label: 'C', monacoLang: 'c' },
    { value: 'go', label: 'Go', monacoLang: 'go' },
  ];

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleSubmit = () => {
    if (!value || !value.trim()) {
      alert('Please write some code before submitting');
      return;
    }
    if (onSubmit) {
      onSubmit({ code: value, language });
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'accepted' || status === 'Accepted') {
      return <SuccessIcon color="success" />;
    }
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = (status) => {
    if (status === 'accepted' || status === 'Accepted') {
      return 'success';
    }
    if (status === 'wrong_answer' || status === 'Wrong Answer') {
      return 'error';
    }
    if (status === 'time_limit_exceeded' || status === 'Time Limit Exceeded') {
      return 'warning';
    }
    return 'default';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Code Editor</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {showSubmitButton && (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Running...' : 'Submit Code'}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ height: height, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Editor
          height="100%"
          language={languages.find(l => l.value === language)?.monacoLang}
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            theme: 'vs-light',
          }}
        />
      </Box>

      {submissionResult && (
        <Box sx={{ mt: 3 }}>
          <Alert
            severity={submissionResult.isCorrect ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">
              {submissionResult.isCorrect ? 'All test cases passed!' : 'Some test cases failed'}
            </Typography>
            <Typography variant="body2">
              Status: {submissionResult.status}
              {submissionResult.points > 0 && ` | Points: ${submissionResult.points}`}
            </Typography>
          </Alert>

          {submissionResult.testCaseResults && submissionResult.testCaseResults.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Test Case Results</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {submissionResult.testCaseResults.map((result, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{ p: 2, mb: 2 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getStatusIcon(result.status)}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          Test Case {index + 1}
                        </Typography>
                        <Chip
                          label={result.status}
                          color={getStatusColor(result.status)}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>

                      {result.output && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            Your Output:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {result.output || '(no output)'}
                          </Box>
                        </Box>
                      )}

                      {result.expectedOutput && result.expectedOutput !== '[Hidden]' && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            Expected Output:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {result.expectedOutput}
                          </Box>
                        </Box>
                      )}

                      {result.error && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="error">
                            Error:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: 'error.50',
                              p: 1,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: 'error.main',
                            }}
                          >
                            {result.error}
                          </Box>
                        </Box>
                      )}

                      {(result.executionTime !== null || result.memoryUsed !== null) && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {result.executionTime !== null && (
                            <Typography variant="caption" color="textSecondary">
                              Time: {result.executionTime}s
                            </Typography>
                          )}
                          {result.memoryUsed !== null && (
                            <Typography variant="caption" color="textSecondary">
                              Memory: {result.memoryUsed}KB
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default CodeEditor;
