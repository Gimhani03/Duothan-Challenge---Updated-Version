import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verify: () => api.get('/auth/verify'),
};

// Teams API
export const teamsAPI = {
  create: (teamData) => api.post('/teams/create', teamData),
  join: (inviteCode) => api.post('/teams/join', { inviteCode }),
  getMyTeam: () => api.get('/teams/my-team'),
  leave: () => api.post('/teams/leave'),
  getAll: (params) => api.get('/teams/all', { params }),
};

// Challenges API
export const challengesAPI = {
  getAll: () => api.get('/challenges'),
  getById: (id) => api.get(`/challenges/${id}`),
  // Admin routes
  create: (challengeData) => api.post('/challenges/admin/create', challengeData),
  update: (id, challengeData) => api.put(`/challenges/admin/${id}`, challengeData),
  delete: (id) => api.delete(`/challenges/admin/${id}`),
  getAllAdmin: () => api.get('/challenges/admin/all'),
  generateUnlockCode: () => api.post('/challenges/generate-unlock-code'),
  unlockBuildathon: (data) => api.post('/challenges/unlock-buildathon', data)
};

// Submissions API
export const submissionsAPI = {
  submit: (submissionData) => api.post('/submissions/submit', submissionData),
  run: (submissionData) => api.post('/submissions/run', submissionData),
  submitCode: (submissionData) => api.post('/submissions/code', submissionData),
  submitGithub: (submissionData) => api.post('/submissions/github', submissionData),
  getMySubmissions: (params) => api.get('/submissions/my-submissions', { params }),
  getMyChallengeSubmissions: (challengeId) => api.get(`/submissions/challenge/${challengeId}`),
  getById: (id) => api.get(`/submissions/${id}`),
  // Admin routes
  getAll: (params) => api.get('/submissions/admin/all', { params }),
  updateStatus: (id, statusData) => api.put(`/submissions/admin/${id}/status`, statusData),
};

// Leaderboard API
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
  getMyTeam: () => api.get('/leaderboard/my-team'),
  getStats: () => api.get('/leaderboard/stats'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getTeams: (params) => api.get('/admin/teams', { params }),
  getTeamDetails: (id) => api.get(`/admin/teams/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deactivateTeam: (id) => api.put(`/admin/teams/${id}/deactivate`),
  getAnalytics: () => api.get('/admin/analytics'),
  resetCompetition: (confirmCode) => api.post('/admin/reset-competition', { confirmCode }),
};

export default api;
