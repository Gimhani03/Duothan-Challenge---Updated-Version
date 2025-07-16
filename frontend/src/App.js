import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import Team from './pages/Team';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
// import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isAuthenticated && <Navigation />}
      {isAuthenticated && <Toolbar />} {/* Spacer for fixed navigation */}
      
      <Box component="main" sx={{ flexGrow: 1, py: isAuthenticated ? 0 : 3 }}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/admin/login" 
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
              ) : (
                <AdminLogin />
              )
            } 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute userOnly>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team" 
            element={
              <ProtectedRoute userOnly>
                <Team />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/challenges" 
            element={
              <ProtectedRoute userOnly>
                <Challenges />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/challenges/:id" 
            element={
              <ProtectedRoute userOnly>
                <ChallengeDetail />
              </ProtectedRoute>
            } 
          />
          {/* 
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
          */}
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
      
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
