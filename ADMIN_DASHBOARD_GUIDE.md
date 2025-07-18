# Admin Dashboard CRUD Operations Guide

## Overview

The DuoThan Challenge Admin Dashboard provides comprehensive CRUD (Create, Read, Update, Delete) operations for managing challenges, teams, users, and system statistics.

## Access Requirements

- **Admin Role**: Only users with admin privileges can access the dashboard
- **Authentication**: Valid JWT token required
- **URL**: `/admin/dashboard` (protected route)

## Features Available

### 1. Challenge Management (CRUD Operations)

#### **Create Challenge**

- **Location**: Challenges Management tab → "Create Challenge" button
- **Fields Available**:
  - Basic Information: Title, Description, Problem Statement
  - Format: Input Format, Output Format, Constraints
  - Examples: Sample Input/Output, Explanation
  - Configuration: Difficulty (Easy/Medium/Hard), Type (Algorithmic/Buildathon)
  - Scoring: Points, Time Limit, Memory Limit
  - Test Cases: Multiple test cases with input/output pairs
  - Visibility: Hidden test cases option

#### **Read/View Challenges**

- **Algorithmic Challenges**: Displayed in dedicated section with blue header
- **Buildathon Challenges**: Displayed in dedicated section with orange header
- **Information Shown**: Title, Difficulty, Points, Time Limit
- **Status Indicators**: Color-coded difficulty chips (Green=Easy, Orange=Medium, Red=Hard)

#### **Update Challenge**

- **Action**: Click "Edit" button on any challenge row
- **Process**: Pre-fills form with existing data, allows modification
- **Validation**: Same validation rules as create operation
- **Confirmation**: Success toast notification on completion

#### **Delete Challenge**

- **Action**: Click "Delete" button on any challenge row
- **Safety**: Confirmation dialog prevents accidental deletion
- **Process**: Soft delete (sets isActive=false)
- **Confirmation**: Success toast notification on completion

### 2. Team Management

#### **View Teams**

- **Information Displayed**: Team name, leader, member count, points, completed challenges
- **Actions Available**: View detailed team information
- **Team Details**: Shows members, invite codes, completion statistics

#### **Team Statistics**

- **Member Management**: View all team members with roles
- **Progress Tracking**: Completed challenges count
- **Points System**: Real-time points calculation

### 3. User Management

#### **User Overview**

- **Information Displayed**: Username, email, role, team affiliation, join date
- **Role Identification**: Admin vs regular user distinction
- **Team Association**: Shows which team user belongs to

### 4. System Statistics

#### **Dashboard Metrics**

- **Team Count**: Total registered teams
- **Challenge Count**: Active challenges available
- **User Count**: Total registered users
- **Submission Count**: Total code submissions

#### **Submission Analytics**

- **Status Breakdown**: Accepted, Wrong Answer, Compilation Error, etc.
- **Percentage Analysis**: Success rate calculations
- **Visual Indicators**: Color-coded status display

### 5. Competition Leaderboard

#### **Ranking System**

- **Position Tracking**: Real-time team rankings
- **Point Calculation**: Based on successful challenge completions
- **Team Information**: Leader, members, total points
- **Visual Hierarchy**: Special styling for top 3 positions

## Technical Implementation

### **Backend API Endpoints**

```javascript
// Challenge Operations
POST /api/challenges/admin/create    // Create new challenge
GET  /api/challenges/admin/all       // Get all challenges
PUT  /api/challenges/admin/:id       // Update challenge
DELETE /api/challenges/admin/:id     // Delete challenge

// Admin Operations
GET  /api/admin/dashboard            // Get dashboard statistics
GET  /api/admin/teams                // Get all teams
GET  /api/admin/users                // Get all users
GET  /api/admin/teams/:id            // Get team details
```

### **Frontend Components**

- **Material-UI**: Comprehensive UI component library
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Automatic data refresh
- **Form Validation**: Client-side and server-side validation

### **Test Case Management**

- **Multiple Test Cases**: Add/remove test cases dynamically
- **Input/Output Pairs**: Specify expected results
- **Hidden Test Cases**: Create tests invisible to participants
- **Validation**: Ensures proper test case format

## Security Features

### **Authentication & Authorization**

- **JWT Tokens**: Secure authentication system
- **Role-based Access**: Admin-only functionality
- **Route Protection**: Unauthorized access prevention

### **Data Validation**

- **Input Sanitization**: Prevents XSS attacks
- **Field Validation**: Required field checking
- **Type Validation**: Ensures data integrity

## Usage Instructions

### **Creating a Challenge**

1. Navigate to "Challenges Management" tab
2. Click "Create Challenge" button
3. Fill in all required fields:
   - Title, Description, Problem Statement
   - Input/Output formats and constraints
   - Sample input/output with explanation
   - Difficulty level and challenge type
   - Points and time limits
4. Add test cases with expected outputs
5. Mark test cases as hidden if needed
6. Click "Create Challenge" to save

### **Managing Existing Challenges**

1. View challenges in the organized sections
2. Use "Edit" to modify challenge details
3. Use "Delete" to remove challenges (with confirmation)
4. Monitor challenge statistics in real-time

### **Monitoring System Health**

1. Check dashboard statistics regularly
2. Monitor submission success rates
3. Track team participation and progress
4. Use leaderboard to gauge competition status

## Best Practices

### **Challenge Creation**

- **Clear Problem Statements**: Write detailed, unambiguous descriptions
- **Comprehensive Test Cases**: Include edge cases and boundary conditions
- **Balanced Difficulty**: Distribute easy, medium, and hard challenges
- **Proper Scoring**: Assign points based on difficulty and time investment

### **System Management**

- **Regular Monitoring**: Check dashboard statistics frequently
- **Data Backup**: Ensure challenge data is backed up
- **Performance Tracking**: Monitor submission processing times
- **User Support**: Address team and user issues promptly

## Troubleshooting

### **Common Issues**

- **Authentication Errors**: Check JWT token validity
- **Permission Denied**: Verify admin role assignment
- **Form Validation**: Ensure all required fields are filled
- **API Errors**: Check server logs for detailed error messages

### **Performance Optimization**

- **Data Pagination**: Handle large datasets efficiently
- **Caching**: Implement caching for frequently accessed data
- **Load Balancing**: Distribute server load during peak usage
- **Database Optimization**: Index frequently queried fields

The admin dashboard provides a complete solution for managing competitive programming challenges with user-friendly interfaces and robust backend support.
